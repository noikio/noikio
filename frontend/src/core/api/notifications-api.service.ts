import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Notification } from '../models/index';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<{ notifications: Notification[]; unread_count: number }> {
    return this.http.get<{ notifications: Notification[]; unread_count: number }>('/api/notifications');
  }

  markAllRead(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>('/api/notifications/read', {});
  }

  markRead(id: number): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`/api/notifications/${id}/read`, {});
  }
}
