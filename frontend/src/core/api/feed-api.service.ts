import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { FeedResponse } from '../models/index';

@Injectable({ providedIn: 'root' })
export class FeedApiService {
  private readonly http = inject(HttpClient);

  get(cursor?: number, limit = 20): Observable<FeedResponse> {
    const params: Record<string, string> = { limit: String(limit) };
    if (cursor != null) params['cursor'] = String(cursor);
    return this.http.get<FeedResponse>('/api/feed', { params });
  }
}
