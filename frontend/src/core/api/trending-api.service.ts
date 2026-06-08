import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Prompt } from '../models/index';

@Injectable({ providedIn: 'root' })
export class TrendingApiService {
  private readonly http = inject(HttpClient);

  get(period: '24h' | '7d' | '30d' = '7d', limit = 20): Observable<Prompt[]> {
    return this.http.get<Prompt[]>('/api/trending', { params: { period, limit: String(limit) } });
  }
}
