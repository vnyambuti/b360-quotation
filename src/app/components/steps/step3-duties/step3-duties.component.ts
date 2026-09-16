import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuotationStateService } from '../../../services/quotation-state.service';
import { Duty, Interval, LineItem } from '../../../models/quotation.models';
import { CHANNEL_CATALOG } from '../../../data/roles-duties.data';

@Component({
  selector: 'app-step3-duties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step3-duties.component.html',
})
export class Step3DutiesComponent {
  state = inject(QuotationStateService);

  readonly intervals: Interval[] = ['Daily', 'Weekly', 'Monthly'];

  private dutyChannelIds(roleId: string, dutyId: string): string[] {
    const role = this.state.roleLibrary.find((r) => r.id === roleId);
    return role?.duties.find((d) => d.id === dutyId)?.channelIds ?? [];
  }

  /** Line items grouped by role, filtered to duties tied to at least one selected channel,
   *  plus that role's manually-removed duties so they can be added back. */
  readonly groupedLineItems = computed(() => {
    const items = this.state.lineItems();
    const roleIds = this.state.selectedRoleIds();
    const selectedChannels = this.state.selectedChannelIds();
    return roleIds.map((roleId) => {
      const role = this.state.roleLibrary.find((r) => r.id === roleId)!;
      const roleItems = items
        .filter((li) => li.roleId === roleId)
        .filter((li) => this.dutyChannelIds(roleId, li.dutyId).some((id) => selectedChannels.includes(id)));
      const total = roleItems.reduce((sum, li) => sum + li.unitPrice * li.intervals, 0);
      const removedDuties: Duty[] = role.duties.filter((d) => this.state.isDutyRemoved(d.id));
      return { role, items: roleItems, total, removedDuties };
    });
  });

  dutyChannelNames(roleId: string, dutyId: string): string[] {
    const selected = this.state.selectedChannelIds();
    return this.dutyChannelIds(roleId, dutyId)
      .filter((id) => selected.includes(id))
      .map((id) => CHANNEL_CATALOG.find((c) => c.id === id)?.name ?? id);
  }

  onFieldChange(item: LineItem, patch: Partial<LineItem>) {
    this.state.updateLineItem(item.dutyId, patch);
  }

  removeDuty(item: LineItem) {
    this.state.removeDuty(item.dutyId);
  }

  restoreDuty(dutyId: string) {
    this.state.restoreDuty(dutyId);
  }
}
