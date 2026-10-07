import { Channel, Duty, Interval, RoleDefinition } from '../models/quotation.models';
import { ProviderChannel, ProviderDuty, ProviderTitle } from '../models/provider.models';

const INTERVALS: readonly Interval[] = ['Daily', 'Weekly', 'Monthly'];

/** Narrows the API's free-form `interval` string to one the wizard can bill. */
export function toInterval(value: string | null | undefined): Interval {
  const match = INTERVALS.find((i) => i.toLowerCase() === (value ?? '').trim().toLowerCase());
  return match ?? 'Monthly';
}

/** Flattens the API's `titles` + `duties` into the role library the wizard browses.
 *  Both sides key off the human-readable `key` rather than the numeric database id.
 *  Pricing lives per channel (`channelRates`), not on the duty itself. */
export function buildRoleLibrary(
  titles: ProviderTitle[],
  duties: ProviderDuty[],
): RoleDefinition[] {
  return titles.map((title) => ({
    id: title.key,
    name: title.name,
    description: title.description,
    duties: duties
      .filter((duty) =>
        duty.titleId ? duty.titleId === title.id : title.dutyIds.includes(duty.key),
      )
      .map<Duty>((duty) => ({
        id: duty.key,
        name: duty.name,
        channelIds: duty.channelIds,
        channelRates: (duty.channelRates ?? []).map((r) => ({
          channelId: r.channelId,
          channelName: r.channelName,
          unitPrice: r.unitPrice,
          interval: toInterval(r.interval),
          quantity: r.quantity ?? 1,
        })),
      })),
  }));
}

export function buildChannelCatalog(channels: ProviderChannel[]): Channel[] {
  return channels.map((channel) => ({
    id: channel.key,
    name: channel.name,
    titleIds: channel.titleIds,
  }));
}
