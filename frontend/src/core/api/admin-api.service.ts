import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';

export interface AdminStats {
  online: {
    count: number;
    users: { id: number; username: string }[];
  };
  users: {
    total: number;
    new_7d: number;
    recent: { id: number; username: string; email: string; created_at: number }[];
  };
  prompts: {
    total: number;
    public: number;
    private: number;
    new_7d: number;
  };
  engagement: {
    comments: number;
    ratings: number;
  };
  top_users: { id: number; username: string; email: string; created_at: number; prompt_count: number }[];
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/admin';

  heartbeat(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/heartbeat`, {});
  }

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/stats`);
  }
}
