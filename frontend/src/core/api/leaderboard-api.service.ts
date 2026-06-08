import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { LeaderboardEntry } from '../models/index';

export type Period = 'day' | 'week' | 'month' | 'year' | 'all';

@Injectable({ providedIn: 'root' })
export class LeaderboardApiService {
  private readonly http = inject(HttpClient);

  getLeaderboard(period: Period = 'month'): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`/api/leaderboard?period=${period}`);
  }
}
