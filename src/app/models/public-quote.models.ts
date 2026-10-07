/** DTOs for the Laravel `POST /api/publicquote` endpoint. */

import { ClientDetails, CompanyDetails, LineItem, PaymentCycle } from './quotation.models';

/** A scheduled instalment with its due date already serialised to ISO-8601. */
export interface PublicQuotePayment {
  index: number;
  label: string;
  dueDate: string;
  amount: number;
}

/** The published quotation. Every field is JSON-safe: dates are ISO-8601 strings, never `Date`. */
export interface PublicQuotePayload {
  dateIssued: string;
  validUntil: string;
  validityDays: number;
  company: CompanyDetails;
  client: ClientDetails;
  roleIds: string[];
  channelIds: string[];
  lineItems: LineItem[];
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  paymentCycle: PaymentCycle;
  payments: PublicQuotePayment[];
}

/** The `{ data: ... }` envelope the endpoint replies with. The link field has been spelled a few
 *  different ways, so all of the plausible names are declared and `PublicQuoteService` picks the
 *  first one that is actually present. */
export interface PublicQuoteResponse {
  data?: {
    id?: number | string;
    slug?: string;
    token?: string;
    publicUrl?: string;
    url?: string;
    link?: string;
  } | null;
  message?: string;
}

/** The normalised result the app renders, whatever the API happened to call things. */
export interface PublicQuoteResult {
  id: number | string | null;
  slug: string;
  /** Empty when the API returned no usable link. */
  publicUrl: string;
  message: string;
}
