/** DTOs for the Laravel `GET /api/getproviders` and `POST /api/getprovider` endpoints. */

/** A provider account as listed in the directory. The detail lookup returns the same shape. */
export interface ProviderProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface ProviderTitle {
  id: number;
  key: string;
  name: string;
  description: string;
  dutyIds: string[];
}

/** One channel's price for a duty, e.g. Instagram at 50,000 x 1 per Monthly. */
export interface ProviderChannelRate {
  channelId: string;
  channelName: string;
  unitPrice: number;
  interval: string; // 'Daily' | 'Weekly' | 'Monthly'
  quantity: number;
  isOverride: boolean;
}

export interface ProviderDuty {
  id: number;
  key: string;
  name: string;
  /** Null on most duties; pricing comes from `channelRates`. */
  defaultPrice: number | null;
  interval: string | null;
  titleId: number;
  titleName: string;
  channelIds: string[];
  channelRates: ProviderChannelRate[];
}

export interface ProviderChannel {
  id: number;
  key: string;
  name: string;
  titleIds: string[];
}

export interface GetProviderData {
  provider: ProviderProfile;
  titles: ProviderTitle[];
  duties: ProviderDuty[];
  channels: ProviderChannel[];
}

export interface GetProviderResponse {
  data: GetProviderData;
}
