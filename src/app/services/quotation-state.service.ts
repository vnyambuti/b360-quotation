import { Injectable, computed, signal } from '@angular/core';
import {
  CompanyDetails,
  ClientDetails,
  Duty,
  Interval,
  LineItem,
  PaymentCycle,
  CyclePayment,
  RoleDefinition,
  lineTotal,
  withChannel,
} from '../models/quotation.models';
import {
  GetProviderData,
  ProviderChannel,
  ProviderDuty,
  ProviderProfile,
  ProviderTitle,
} from '../models/provider.models';
import { PublicQuotePayload, PublicQuoteResult } from '../models/public-quote.models';
import { buildChannelCatalog, buildRoleLibrary } from '../data/provider-catalog';

export type ProviderLookupStatus = 'idle' | 'loading' | 'success' | 'error';
export type PublishStatus = 'idle' | 'loading' | 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class QuotationStateService {
  // ---------- Provider directory ----------
  readonly providerList = signal<ProviderProfile[]>([]);
  readonly listStatus = signal<ProviderLookupStatus>('idle');
  readonly listError = signal<string | null>(null);

  // ---------- Selected provider ----------
  readonly provider = signal<ProviderProfile | null>(null);
  readonly providerTitles = signal<ProviderTitle[]>([]);
  readonly providerDuties = signal<ProviderDuty[]>([]);
  readonly providerChannels = signal<ProviderChannel[]>([]);
  readonly lookupStatus = signal<ProviderLookupStatus>('idle');
  readonly lookupError = signal<string | null>(null);
  /** Which tile in the directory is currently being fetched, for per-tile spinners. */
  readonly pendingProviderId = signal<number | null>(null);

  /** Prefilled details stay read-only until the user asks to look up a different account. */
  readonly companyLocked = computed(() => this.provider() !== null);
  readonly providerDetailsLoaded = computed(() => this.provider() !== null);

  readonly roleLibrary = computed(() =>
    buildRoleLibrary(this.providerTitles(), this.providerDuties()),
  );
  readonly channelCatalog = computed(() => buildChannelCatalog(this.providerChannels()));

  // ---------- Step 1: Company & client ----------
  readonly company = signal<CompanyDetails>({
    name: '',
    address: '',
    phone: '',
    email: '',
    logoDataUrl: null,
  });
  readonly client = signal<ClientDetails>({ name: '', address: '', contact: '' });
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

  // ---------- Publishing ----------
  readonly publishStatus = signal<PublishStatus>('idle');
  readonly publishError = signal<string | null>(null);
  /** The shareable link the API handed back once the quote went live. */
  readonly publicQuoteUrl = signal<string | null>(null);
  readonly publishMessage = signal<string | null>(null);

  // ---------- Derived / computed ----------
  readonly validUntil = computed(() => {
    const d = new Date(this.dateIssued());
    d.setDate(d.getDate() + this.validityDays());
    return d;
  });

  /** Lines with at least one channel ticked. Everything billable or published comes from here. */
  readonly activeLineItems = computed(() =>
    this.lineItems().filter((li) => li.channels.some((c) => c.selected)),
  );

  /** At least one line is billable. Used by the wizard's "Duties & Pricing" step check. */
  readonly lineItemsValid = computed(() => this.activeLineItems().length > 0);

  readonly subtotal = computed(() =>
    this.activeLineItems().reduce((sum, li) => sum + lineTotal(li), 0),
  );
  readonly taxAmount = computed(() => this.subtotal() * this.taxRate());
  readonly grandTotal = computed(() => this.subtotal() + this.taxAmount());

  readonly roleSubtotals = computed(() => {
    const map = new Map<string, number>();
    for (const li of this.activeLineItems()) {
      map.set(li.roleName, (map.get(li.roleName) ?? 0) + lineTotal(li));
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

  /** The exact body posted to `POST /api/publicquote`, with every `Date` flattened to ISO-8601 so
   *  the payload survives `JSON.stringify`. */
  readonly publicQuotePayload = computed<PublicQuotePayload>(() => {
    const company = this.company();
    const client = this.client();
    const activeItems = this.activeLineItems();

    return {
      dateIssued: this.dateIssued().toISOString(),
      validUntil: this.validUntil().toISOString(),
      validityDays: this.validityDays(),
      company: { ...company },
      client: { ...client },
      roleIds: this.selectedRoleIds(),
      // Derived from what was actually ticked on each duty, not from step 3 alone.
      channelIds: [
        ...new Set(
          activeItems.flatMap((li) =>
            li.channels.filter((c) => c.selected).map((c) => c.channelId),
          ),
        ),
      ],
      lineItems: activeItems,
      taxRate: this.taxRate(),
      subtotal: this.subtotal(),
      taxAmount: this.taxAmount(),
      grandTotal: this.grandTotal(),
      paymentCycle: { ...this.paymentCycle() },
      payments: this.cyclePayments().map((p) => ({
        index: p.index,
        label: p.label,
        dueDate: p.dueDate.toISOString(),
        amount: p.amount,
      })),
    };
  });

  // ---------- Mutators ----------
  updateCompany(patch: Partial<CompanyDetails>) {
    this.company.update((c) => ({ ...c, ...patch }));
  }

  startLookup(providerId: number) {
    this.pendingProviderId.set(providerId);
    this.lookupStatus.set('loading');
    this.lookupError.set(null);
  }

  failLookup(message: string) {
    this.pendingProviderId.set(null);
    this.lookupStatus.set('error');
    this.lookupError.set(message);
  }

  setProviderList(providers: ProviderProfile[]) {
    this.providerList.set(providers);
    this.listStatus.set('success');
    this.listError.set(null);
  }

  failProviderList(message: string) {
    this.listStatus.set('error');
    this.listError.set(message);
  }

  /** Stores a successful lookup: prefills the locked company fields and swaps in the
   *  provider's own roles, duties and channels, discarding anything selected from the
   *  previous catalog. */
  applyProvider(data: GetProviderData) {
    this.provider.set(data.provider);
    this.providerTitles.set(data.titles);
    this.providerDuties.set(data.duties);
    this.providerChannels.set(data.channels);
    this.lookupStatus.set('success');
    this.lookupError.set(null);
    this.pendingProviderId.set(null);

    this.updateCompany({
      name: data.provider.name,
      phone: data.provider.phone,
      email: data.provider.email,
    });

    this.resetQuotationBody();
  }

  /** Unlocks the company fields so a different account can be looked up. */
  resetProvider() {
    this.provider.set(null);
    this.providerTitles.set([]);
    this.providerDuties.set([]);
    this.providerChannels.set([]);
    this.lookupStatus.set('idle');
    this.lookupError.set(null);
    this.pendingProviderId.set(null);

    this.updateCompany({ name: '', phone: '', email: '' });
    this.resetQuotationBody();
  }

  private resetQuotationBody() {
    this.selectedRoleIds.set([]);
    this.selectedChannelIds.set([]);
    this.lineItems.set([]);
    this.removedDutyIds.set(new Set());
    // A link published for the old body is stale the moment the quote changes.
    this.publishStatus.set('idle');
    this.publishError.set(null);
    this.publicQuoteUrl.set(null);
    this.publishMessage.set(null);
  }

  updateClient(patch: Partial<ClientDetails>) {
    this.client.update((c) => ({ ...c, ...patch }));
  }

  startPublish() {
    this.publishStatus.set('loading');
    this.publishError.set(null);
    this.publicQuoteUrl.set(null);
    this.publishMessage.set(null);
  }

  failPublish(message: string) {
    this.publishStatus.set('error');
    this.publishError.set(message);
  }

  succeedPublish(result: PublicQuoteResult) {
    this.publishStatus.set('success');
    this.publishError.set(null);
    this.publicQuoteUrl.set(result.publicUrl || null);
    this.publishMessage.set(result.message || null);
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

  /** Step 3 toggle. Also pushes the choice into every line item so channels ticked here
   *  are preselected on each duty that supports them. */
  toggleChannel(channelId: string) {
    const current = this.selectedChannelIds();
    const on = !current.includes(channelId);
    this.selectedChannelIds.set(
      on ? [...current, channelId] : current.filter((id) => id !== channelId),
    );
    this.lineItems.update((items) => items.map((li) => withChannel(li, channelId, on)));
  }

  isChannelSelected(channelId: string): boolean {
    return this.selectedChannelIds().includes(channelId);
  }

  private channelIdsForRoles(roleIds: string[]): Set<string> {
    const ids = new Set<string>();
    for (const roleId of roleIds) {
      const role = this.roleLibrary().find((r) => r.id === roleId);
      role?.duties.forEach((duty) => duty.channelIds.forEach((id) => ids.add(id)));
    }
    return ids;
  }

  private syncChannelsWithRoles(roleIds: string[]) {
    const available = this.channelIdsForRoles(roleIds);
    this.selectedChannelIds.update((ids) => ids.filter((id) => available.has(id)));
  }

  /** Builds a line item for a duty. Channels ticked in step 3 are preselected where the duty
   *  has a rate for them; the line's interval is taken from the first preselected channel. */
  private createLineItem(role: RoleDefinition, duty: Duty): LineItem {
    const wanted = new Set(this.selectedChannelIds());
    const first = duty.channelRates.find((r) => wanted.has(r.channelId));
    const interval: Interval = first?.interval ?? duty.channelRates[0]?.interval ?? 'Monthly';

    return {
      roleId: role.id,
      roleName: role.name,
      dutyId: duty.id,
      dutyName: duty.name,
      channels: duty.channelRates.map((r) => ({
        ...r,
        selected: wanted.has(r.channelId) && r.interval === interval,
      })),
      interval,
      intervals: 1,
    };
  }

  private syncLineItemsWithRoles(roleIds: string[]) {
    const existing = this.lineItems();
    const kept = existing.filter((li) => roleIds.includes(li.roleId));
    const keptDutyIds = new Set(kept.map((li) => li.dutyId));
    const removed = this.removedDutyIds();

    const additions: LineItem[] = [];
    for (const roleId of roleIds) {
      const role = this.roleLibrary().find((r) => r.id === roleId);
      if (!role) continue;
      for (const duty of role.duties) {
        if (!keptDutyIds.has(duty.id) && !removed.has(duty.id)) {
          additions.push(this.createLineItem(role, duty));
        }
      }
    }
    this.lineItems.set([...kept, ...additions]);

    this.removedDutyIds.update((set) => {
      const next = new Set(set);
      for (const dutyId of set) {
        const stillInScope = roleIds.some((rid) =>
          this.roleLibrary()
            .find((r) => r.id === rid)
            ?.duties.some((d) => d.id === dutyId),
        );
        if (!stillInScope) next.delete(dutyId);
      }
      return next;
    });
  }

  updateLineItem(dutyId: string, patch: Partial<LineItem>) {
    this.lineItems.update((items) =>
      items.map((li) => (li.dutyId === dutyId ? { ...li, ...patch } : li)),
    );
  }

  /** Ticks or unticks one channel on one duty. The line's interval follows the first ticked
   *  channel, and a channel with a clashing interval is refused (see `withChannel`). */
  toggleDutyChannel(dutyId: string, channelId: string) {
    this.lineItems.update((items) =>
      items.map((li) => {
        if (li.dutyId !== dutyId) return li;
        const current = li.channels.find((c) => c.channelId === channelId);
        return current ? withChannel(li, channelId, !current.selected) : li;
      }),
    );
  }

  /** Only the count is editable; the unit (day/week/month) comes from the channel rates. */
  setIntervals(dutyId: string, count: number) {
    this.updateLineItem(dutyId, { intervals: Math.max(1, Math.floor(count) || 1) });
  }

  removeDuty(dutyId: string) {
    this.lineItems.update((items) => items.filter((li) => li.dutyId !== dutyId));
    this.removedDutyIds.update((set) => new Set(set).add(dutyId));
  }

  restoreDuty(dutyId: string) {
    let restored: LineItem | null = null;
    for (const role of this.roleLibrary()) {
      const duty = role.duties.find((d) => d.id === dutyId);
      if (duty) {
        restored = this.createLineItem(role, duty);
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
      cycleCount:
patch.cycleCount !== undefined
        ? Math.max(1, Math.floor(patch.cycleCount) || 1)
        : c.cycleCount,
    }));
  }
}
