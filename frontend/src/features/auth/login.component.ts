import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../state/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="max-w-sm mx-auto mt-16">
      <div class="glass-card p-8 space-y-6">
        <div>
          <h1 class="text-xl font-semibold text-slate-100">Sign in</h1>
          <p class="text-sm text-slate-500 mt-1">We'll send a one-time code to your email.</p>
        </div>

        @if (error()) {
          <div class="text-sm text-red-400 px-3 py-2 rounded-lg" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2)">{{ error() }}</div>
        }

        @if (step() === 'email') {
          <form (ngSubmit)="requestCode()" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input [(ngModel)]="email" name="email" type="email" autocomplete="email" required
                class="glass-input px-3 py-2.5 text-sm" placeholder="you@example.com" />
            </div>
            <button type="submit" [disabled]="authStore.loading()" class="btn-primary w-full py-2.5 text-sm justify-center">
              {{ authStore.loading() ? 'Sending…' : 'Send code' }}
            </button>
          </form>
        } @else {
          <form (ngSubmit)="verifyCode()" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">6-digit code</label>
              <p class="text-xs text-slate-500 mb-2">Sent to {{ sentEmail() }}</p>
              <input [(ngModel)]="code" name="code" type="text" inputmode="numeric" maxlength="6" required
                class="glass-input px-3 py-2.5 text-sm tracking-widest font-mono text-center" placeholder="000000" autofocus />
            </div>
            <button type="submit" [disabled]="authStore.loading()" class="btn-primary w-full py-2.5 text-sm justify-center">
              {{ authStore.loading() ? 'Verifying…' : 'Sign in' }}
            </button>
            <button type="button" (click)="step.set('email')" class="text-xs text-slate-500 hover:text-slate-300 w-full text-center transition-colors cursor-pointer">
              Use a different email
            </button>
          </form>
        }

        <p class="text-sm text-slate-500 text-center">
          No account? <a routerLink="/auth/register" class="text-indigo-400 hover:text-violet-400 transition-colors">Create one</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  readonly authStore = inject(AuthStore);

  email = '';
  code = '';
  readonly sentEmail = signal(''); // captured before @if tears down the email input
  readonly step = signal<'email' | 'otp'>('email');
  readonly error = signal('');

  requestCode(): void {
    this.error.set('');
    this.sentEmail.set(this.email);
    this.authStore.requestOtp(
      this.sentEmail(),
      () => this.step.set('otp'),
      (msg) => this.error.set(msg),
    );
  }

  verifyCode(): void {
    this.error.set('');
    this.authStore.verifyOtp(
      this.sentEmail(),
      this.code,
      () => {},
      (msg) => this.error.set(msg),
    );
  }
}
