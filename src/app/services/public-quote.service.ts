import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  PublicQuotePayload,
  PublicQuoteResponse,
  PublicQuoteResult,
} from '../models/public-quote.models';
import { API_BASE_URL } from './api-base-url.token';

@Injectable({ providedIn: 'root' })
export class PublicQuoteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Publishes a quotation and hands back the public link the client can share. */
  publish(payload: PublicQuotePayload): Observable<PublicQuoteResult> {
    return this.http
      .post<PublicQuoteResponse>(`${this.baseUrl}/api/publicquote`, payload)
      .pipe(map(toResult));
  }
}


function toResult(res: PublicQuoteResponse | null): PublicQuoteResult {
  const data = res?.data ?? {};
  const slug = data['slug'] ?? data['token'] ?? '';
  const publicUrl =
    data['publicUrl'] ?? data['url'] ?? data['link'] ?? (slug ? `/quotes/${slug}` : '');

  return {
    id: data['id'] ?? null,
    slug,
    publicUrl,
    message: res?.message ?? '',
  };
}
