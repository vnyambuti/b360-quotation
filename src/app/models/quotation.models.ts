export type Interval = 'Daily' | 'Weekly' | 'Monthly';
export type PaymentFrequency = 'Weekly' | 'Monthly' | 'Annually';

/** One channel's rate for a duty, e.g. Instagram at 50,000 x 1 per Month. */
export interface ChannelRate {
  channelId: string;
  channelName: string;
  unitPrice: number;
  interval: Interval;
  quantity: number;
}

export interface Duty {
  id: string;
  name: string;
  channelIds: string[];
  channelRates: ChannelRate[];
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  duties: Duty[];
}

/** A channel rate on a line item, plus whether the user has ticked it. */
export interface LineChannel extends ChannelRate {
  selected: boolean;
}

export interface LineItem {
  roleId: string;
  roleName: string;
  dutyId: string;
  dutyName: string;
  channels: LineChannel[];
  /** Period unit, locked to the selected channels' interval. The user cannot change it. */
  interval: Interval;
  /** How many of that period to bill, e.g. 6 = 6 months. This is the only editable period field. */
  intervals: number;
}

/** Cost of one period (sum of selected channels). */
export const periodCost = (li: LineItem): number =>
  li.channels.filter((c) => c.selected).reduce((s, c) => s + c.unitPrice * c.quantity, 0);

export const lineTotal = (li: LineItem): number => periodCost(li) * li.intervals;

/** A channel with a different interval than the ones already chosen is disabled,
 *  so a single line never mixes months and days. */
export const isChannelSelectable = (li: LineItem, c: LineChannel): boolean =>
  c.selected || !li.channels.some((x) => x.selected) || c.interval === li.interval;

export const intervalUnit = (i: Interval, n: number): string => {
  const base = { Daily: 'day', Weekly: 'week', Monthly: 'month' }[i];
  return n === 1 ? base : base + 's';
};

/** Turns one channel on/off on a line, refusing a channel whose interval clashes with the ones
 *  already chosen, and re-deriving the line's interval from whatever is selected. */
export function withChannel(li: LineItem, channelId: string, on: boolean): LineItem {
  const target = li.channels.find((c) => c.channelId === channelId);
  if (!target) return li;
  if (on && !isChannelSelectable(li, target)) return li;

  const channels = li.channels.map((c) =>
    c.channelId === channelId ? { ...c, selected: on } : c,
  );
  const first = channels.find((c) => c.selected);
  return { ...li, channels, interval: first?.interval ?? li.interval };
}

export interface Milestone {
  id: string;
  name: string;
  trigger: string;
  percent: number; // 0-100, of grand total
  dueDate?: string;
}

export interface CompanyDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoDataUrl: string | null;
}

export interface ClientDetails {
  name: string;
  address: string;
  contact: string;
}

export interface RoleSubtotal {
  roleName: string;
  total: number;
}

export interface MilestoneWithAmount extends Milestone {
  amount: number;
}

export interface Channel {
  id: string;
  name: string;
  /** Keys of the titles that use this channel — used to group channels by discipline. */
  titleIds: string[];
}

export interface PaymentCycle {
  frequency: PaymentFrequency;
  cycleCount: number;
}

export interface CyclePayment {
  index: number;
  label: string;
  dueDate: Date;
  amount: number;
}
