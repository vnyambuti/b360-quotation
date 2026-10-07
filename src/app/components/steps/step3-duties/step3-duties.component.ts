import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuotationStateService } from '../../../services/quotation-state.service';
import {
  Duty,
  LineChannel,
  LineItem,
  intervalUnit,
  isChannelSelectable,
  lineTotal,
  periodCost,
} from '../../../models/quotation.models';

@Component({
  selector: 'app-step3-duties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step3-duties.component.html',
})
export class Step3DutiesComponent {
  state = inject(QuotationStateService);

  // Exposed for the template.
  readonly lineTotal = lineTotal;
  readonly periodCost = periodCost;
  readonly isChannelSelectable = isChannelSelectable;
  readonly intervalUnit = intervalUnit;

  /** Line items grouped by role, plus each role's removed duties so they can be added back. */
  readonly groupedLineItems = computed(() => {
    const items = this.state.lineItems();
    return this.state.selectedRoleIds().map((roleId) => {
      const role = this.state.roleLibrary().find((r) => r.id === roleId)!;
      const roleItems = items.filter((li) => li.roleId === roleId);
      const total = roleItems.reduce((sum, li) => sum + lineTotal(li), 0);
      const removedDuties: Duty[] = role.duties.filter((d) => this.state.isDutyRemoved(d.id));
      return { role, items: roleItems, total, removedDuties };
    });
  });

  toggleChannel(item: LineItem, channel: LineChannel) {
    this.state.toggleDutyChannel(item.dutyId, channel.channelId);
  }

  onIntervalsChange(item: LineItem, value: number) {
    this.state.setIntervals(item.dutyId, value);
  }

  removeDuty(item: LineItem) {
    this.state.removeDuty(item.dutyId);
  }

  restoreDuty(dutyId: string) {
    this.state.restoreDuty(dutyId);
  }
}
