import { InjectionToken } from '@angular/core';

/** Base URL of the Laravel API. Override it per environment via the `API_BASE_URL` provider. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:8000',
});
