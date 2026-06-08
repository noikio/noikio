import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { UserProfile } from '../models/index';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);

  getProfile(username: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`/api/users/${encodeURIComponent(username)}`);
  }
}
