import { inject, Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApiService } from '../core/api/auth-api.service';
import type { User } from '../core/models/index';

function extractError(e: unknown): string {
  const body = (e as { error?: unknown })?.error as Record<string, unknown> | undefined;
  if (!body) return 'An error occurred';
  // Auth routes return { error: "string" }
  if (typeof body['error'] === 'string') return body['error'];
  // @hono/zod-validator returns { success: false, error: { issues: [...] } }
  const zodErr = body['error'] as { issues?: { message: string }[] } | undefined;
  if (zodErr?.issues?.length) return zodErr.issues[0].message;
  return 'An error occurred';
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApiService);
  private readonly router = inject(Router);

  private readonly _user = signal<User | null>(null);
  private readonly _loading = signal(false);

  readonly currentUser = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly loading = this._loading.asReadonly();

  init(): Promise<void> {
    const token = localStorage.getItem('session_token');
    if (!token) return Promise.resolve();
    return new Promise((resolve) => {
      this.api.me().subscribe({
        next: (user) => {
          this._user.set(user);
          resolve();
        },
        error: () => {
          localStorage.removeItem('session_token');
          resolve();
        },
      });
    });
  }

  register(
    email: string,
    username: string,
    onSuccess: () => void,
    onError: (msg: string) => void,
    plan?: 'pro' | 'enterprise',
  ): void {
    this._loading.set(true);
    this.api.register({ email, username, plan }).subscribe({
      next: () => {
        this._loading.set(false);
        onSuccess();
      },
      error: (e) => {
        this._loading.set(false);
        onError(extractError(e));
      },
    });
  }

  requestOtp(email: string, onSuccess: () => void, onError: (msg: string) => void): void {
    this._loading.set(true);
    this.api.requestOtp({ email }).subscribe({
      next: () => {
        this._loading.set(false);
        onSuccess();
      },
      error: (e) => {
        this._loading.set(false);
        onError(extractError(e));
      },
    });
  }

  verifyOtp(
    email: string,
    code: string,
    onSuccess: () => void,
    onError: (msg: string) => void,
  ): void {
    this._loading.set(true);
    this.api.verifyOtp({ email, code }).subscribe({
      next: (session) => {
        localStorage.setItem('session_token', session.token);
        this._user.set(session.user);
        this._loading.set(false);
        this.router.navigate(['/prompts']);
        onSuccess();
      },
      error: (e) => {
        this._loading.set(false);
        onError(extractError(e));
      },
    });
  }

  logout(): void {
    this.api.logout().subscribe();
    localStorage.removeItem('session_token');
    this._user.set(null);
    this.router.navigate(['/']);
  }
}
