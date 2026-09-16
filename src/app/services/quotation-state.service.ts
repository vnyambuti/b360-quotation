import { Injectable, computed, signal } from '@angular/core';
import {
  CompanyDetails,
  ClientDetails,
  LineItem,
  PaymentCycle,
  CyclePayment,
} from '../models/quotation.models';
import { ROLE_LIBRARY, CHANNEL_CATALOG } from '../data/roles-duties.data';

@Injectable({ providedIn: 'root' })
export class QuotationStateService {
  readonly roleLibrary = ROLE_LIBRARY;
  readonly channelCatalog = CHANNEL_CATALOG;

  // ---------- Step 1: Company & client ----------
  readonly company = signal<CompanyDetails>({
    name: '',
    address: '',
    phone: '',
    email: '',
    logoDataUrl: null,
  });
  readonly client = signal<ClientDetails>({ name: '', address: '', contact: '' });
  readonly quoteNo = signal(this.generateQuoteNo());
  readonly dateIssued = signal<Date>(new Date());
  readonly validityDays = signal(30);

  // ---------- Step 2: Roles ----------
  readonly selectedRoleIds = signal<string[]>([]);

  // ---------- Step 3: Channels ----------
  readonly selectedChannelIds = signal<string[]>([]);

  // ---------- Step 4: Duties & pricing ----------
  readonly lineItems = signal<LineItem[]>([]);
  readonly removedDutyIds = signal<Set<string>>(new Set());

  // ---------- Step 5: Tax & payment cycle ----------
  readonly taxRate = signal(0.16); // 16% VAT
  readonly paymentCycle = signal<PaymentCycle>({ frequency: 'Monthly', cycleCount: 3 });

  // ---------- Derived / computed ----------
  readonly validUntil = computed(() => {
    const d = new Date(this.dateIssued());
    d.setDate(d.getDate() + this.validityDays());
    return d;
  });

  readonly subtotal = computed(() =>
    this.lineItems().reduce((sum, li) => sum + li.unitPrice * li.intervals, 0)
  );
  readonly taxAmount = computed(() => this.subtotal() * this.taxRate());
  readonly grandTotal = computed(() => this.subtotal() + this.taxAmount());

  readonly roleSubtotals = computed(() => {
    const map = new Map<string, number>();
    for (const li of this.lineItems()) {
      map.set(li.roleName, (map.get(li.roleName) ?? 0) + li.unitPrice * li.intervals);
    }
    return Array.from(map.entries()).map(([roleName, total]) => ({ roleName, total }));
  });

  /** The grand total split evenly across `cycleCount` payments, due on `frequency` intervals from the issue date. */
  readonly cyclePayments = computed<CyclePayment[]>(() => {
    const { frequency, cycleCount } = this.paymentCycle();
    const count = Math.max(1, Math.floor(cycleCount) || 1);
    const total = this.grandTotal();
    const amount = total / count;

    const payments: CyclePayment[] = [];
    for (let i = 0; i < count; i++) {
      const dueDate = new Date(this.dateIssued());
      if (frequency === 'Weekly') dueDate.setDate(dueDate.getDate() + 7 * (i + 1));
      else if (frequency === 'Monthly') dueDate.setMonth(dueDate.getMonth() + (i + 1));
      else dueDate.setFullYear(dueDate.getFullYear() + (i + 1));
      payments.push({ index: i + 1, label: `Payment ${i + 1}`, dueDate, amount });
    }
    return payments;
  });

  /** Kept for compatibility with the wizard step-validity check: a payment cycle is always
   *  "balanced" once it has at least one cycle, since the split is always equal by construction. */
  readonly paymentCycleValid = computed(() => this.paymentCycle().cycleCount >= 1);

  // ---------- Mutators ----------
  updateCompany(patch: Partial<CompanyDetails>) {
    this.company.update((c) => ({ ...c, ...patch }));
  }

  updateClient(patch: Partial<ClientDetails>) {
    this.client.update((c) => ({ ...c, ...patch }));
  }

  toggleRole(roleId: string) {
    const current = this.selectedRoleIds();
    const next = current.includes(roleId)
      ? current.filter((id) => id !== roleId)
      : [...current, roleId];
    this.selectedRoleIds.set(next);
    this.syncLineItemsWithRoles(next);
    this.syncChannelsWithRoles(next);
  }

  isRoleSelected(roleId: string): boolean {
    return this.selectedRoleIds().includes(roleId);
  }

  toggleChannel(channelId: string) {
    const current = this.selectedChannelIds();
    const next = current.includes(channelId)
      ? current.filter((id) => id !== channelId)
      : [...current, channelId];
    this.selectedChannelIds.set(next);
  }

  isChannelSelected(channelId: string): boolean {
    return this.selectedChannelIds().includes(channelId);
  }

  private channelIdsForRoles(roleIds: string[]): Set<string> {
    const ids = new Set<string>();
    for (const roleId of roleIds) {
      const role = this.roleLibrary.find((r) => r.id === roleId);
      role?.duties.forEach((duty) => duty.channelIds.forEach((id) => ids.add(id)));
    }
    return ids;
  }

  private syncChannelsWithRoles(roleIds: string[]) {
    const available = this.channelIdsForRoles(roleIds);
    this.selectedChannelIds.update((ids) => ids.filter((id) => available.has(id)));
  }

  private syncLineItemsWithRoles(roleIds: string[]) {
    const existing = this.lineItems();
    const kept = existing.filter((li) => roleIds.includes(li.roleId));
    const keptDutyIds = new Set(kept.map((li) => li.dutyId));
    const removed = this.removedDutyIds();

    const additions: LineItem[] = [];
    for (const roleId of roleIds) {
      const role = this.roleLibrary.find((r) => r.id === roleId);
      if (!role) continue;
      for (const duty of role.duties) {
        if (!keptDutyIds.has(duty.id) && !removed.has(duty.id)) {
          additions.push({
            roleId: role.id,
            roleName: role.name,
            dutyId: duty.id,
            dutyName: duty.name,
            unitPrice: duty.defaultPrice,
            interval: 'Weekly',
            intervals: 1,
          });
        }
      }
    }
    this.lineItems.set([...kept, ...additions]);

    this.removedDutyIds.update((set) => {
      const next = new Set(set);
      for (const dutyId of set) {
        const stillInScope = roleIds.some((rid) =>
          this.roleLibrary.find((r) => r.id === rid)?.duties.some((d) => d.id === dutyId),
        );
        if (!stillInScope) next.delete(dutyId);
      }
      return next;
    });
  }

  updateLineItem(dutyId: string, patch: Partial<LineItem>) {
    this.lineItems.update((items) =>
      items.map((li) => (li.dutyId === dutyId ? { ...li, ...patch } : li))
    );
  }

  removeDuty(dutyId: string) {
    this.lineItems.update((items) => items.filter((li) => li.dutyId !== dutyId));
    this.removedDutyIds.update((set) => new Set(set).add(dutyId));
  }

  restoreDuty(dutyId: string) {
    let restored: LineItem | null = null;
    for (const role of this.roleLibrary) {
      const duty = role.duties.find((d) => d.id === dutyId);
      if (duty) {
        restored = {
          roleId: role.id,
          roleName: role.name,
          dutyId: duty.id,
          dutyName: duty.name,
          unitPrice: duty.defaultPrice,
          interval: 'Weekly',
          intervals: 1,
        };
        break;
      }
    }
    if (!restored) return;

    this.removedDutyIds.update((set) => {
      const next = new Set(set);
      next.delete(dutyId);
      return next;
    });
    this.lineItems.update((items) => [...items, restored!]);
  }

  isDutyRemoved(dutyId: string): boolean {
    return this.removedDutyIds().has(dutyId);
  }

  updatePaymentCycle(patch: Partial<PaymentCycle>) {
    this.paymentCycle.update((c) => ({
      ...c,
      ...patch,
      cycleCount: patch.cycleCount !== undefined ? Math.max(1, Math.floor(patch.cycleCount) || 1) : c.cycleCount,
    }));
  }

  private generateQuoteNo(): string {
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    return `Q-${year}-${rand}`;
  }
}
