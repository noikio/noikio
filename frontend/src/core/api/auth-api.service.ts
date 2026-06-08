import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { User } from '../models/index';

export interface RegisterDto { email: string; username: string; plan?: 'pro' | 'enterprise'; }
export interface OtpRequestDto { email: string; }
export interface OtpVerifyDto { email: string; code: string; }
export interface AuthSession { token: string; user: User; }

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/auth';

  register(dto: RegisterDto): Observable<User> {
    return this.http.post<User>(`${this.base}/register`, dto);
  }

  requestOtp(dto: OtpRequestDto): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/otp/request`, dto);
  }

  verifyOtp(dto: OtpVerifyDto): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.base}/otp/verify`, dto);
  }

  logout(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/logout`, {});
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.base}/me`);
  }
}
