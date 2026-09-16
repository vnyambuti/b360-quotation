export type Interval = 'Daily' | 'Weekly' | 'Monthly';
export type PaymentFrequency = 'Weekly' | 'Monthly' | 'Annually';

export interface Duty {
  id: string;
  name: string;
  defaultPrice: number;
  channelIds: string[];
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  duties: Duty[];
}

export interface LineItem {
  roleId: string;
  roleName: string;
  dutyId: string;
  dutyName: string;
  unitPrice: number;
  interval: Interval;
  intervals: number; // number of Daily/Weekly/Monthly periods billed
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
  role: string;
}
export interface PaymentCycle {
  frequency: PaymentFrequency;
  cycleCount: number; // number of payments to split the grand total across
}

export interface CyclePayment {
  index: number;
  label: string;
  dueDate: Date;
  amount: number;
}


