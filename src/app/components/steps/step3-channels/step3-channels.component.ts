import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotationStateService } from '../../../services/quotation-state.service';
import { CHANNEL_CATALOG } from '../../../data/roles-duties.data';
import { Channel } from '../../../models/quotation.models';

interface ChannelGroup {
  role: string;
  channels: Channel[];
}

@Component({
  selector: 'app-step3-channels',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step3-channels.component.html',
})
export class Step3ChannelsComponent {
  state = inject(QuotationStateService);

  /** Channel ids actually used by duties belonging to the currently selected roles. */
  readonly availableChannelIds = computed(() => {
    const roleIds = this.state.selectedRoleIds();
    const ids = new Set<string>();
    for (const roleId of roleIds) {
      const role = this.state.roleLibrary.find((r) => r.id === roleId);
      role?.duties.forEach((duty) => duty.channelIds.forEach((id) => ids.add(id)));
    }
    return ids;
  });

  /** Available channels, grouped by their catalog role label, in catalog order. */
  readonly channelGroups = computed<ChannelGroup[]>(() => {
    const availableIds = this.availableChannelIds();
    const groups = new Map<string, Channel[]>();
    for (const channel of CHANNEL_CATALOG) {
      if (!availableIds.has(channel.id)) continue;
      const list = groups.get(channel.role) ?? [];
      list.push(channel);
      groups.set(channel.role, list);
    }
    return Array.from(groups.entries()).map(([role, channels]) => ({ role, channels }));
  });

  isSelected(id: string): boolean {
    return this.state.selectedChannelIds().includes(id);
  }

  toggle(id: string): void {
    this.state.toggleChannel(id);
  }
}
