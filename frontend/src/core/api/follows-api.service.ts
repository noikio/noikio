import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FollowsApiService {
  private readonly http = inject(HttpClient);

  follow(username: string): Observable<{ following: boolean }> {
    return this.http.post<{ following: boolean }>(`/api/users/${encodeURIComponent(username)}/follow`, {});
  }

  unfollow(username: string): Observable<{ following: boolean }> {
    return this.http.delete<{ following: boolean }>(`/api/users/${encodeURIComponent(username)}/follow`);
  }

  getFollowers(username: string): Observable<{ id: number; username: string; created_at: number }[]> {
    return this.http.get<{ id: number; username: string; created_at: number }[]>(`/api/users/${encodeURIComponent(username)}/followers`);
  }

  getFollowing(username: string): Observable<{ id: number; username: string; created_at: number }[]> {
    return this.http.get<{ id: number; username: string; created_at: number }[]>(`/api/users/${encodeURIComponent(username)}/following`);
  }
}
