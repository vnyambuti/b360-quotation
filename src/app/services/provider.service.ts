import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { GetProviderResponse, ProviderProfile } from '../models/provider.models';
import { API_BASE_URL } from './api-base-url.token';

@Injectable({ providedIn: 'root' })
export class ProviderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Every provider account that can be quoted for. */
  getProviders(): Observable<ProviderProfile[]> {
    return this.http
      .get<ProviderProfile[] | { data: ProviderProfile[] }>(`${this.baseUrl}/api/getproviders`)
      .pipe(map((res) => (Array.isArray(res) ? res : (res?.data ?? []))));
  }

  /** Looks up a provider account by email along with the roles, duties and channels it offers. */
  getProvider(email: string): Observable<GetProviderResponse> {
    return this.http.post<GetProviderResponse>(`${this.baseUrl}/api/getprovider`, { email });
  }
}
