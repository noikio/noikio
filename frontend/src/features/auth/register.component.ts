import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../state/auth.store';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="max-w-sm mx-auto mt-16">
      <div class="glass-card p-8 space-y-6">
        <div>
          <h1 class="text-xl font-semibold text-slate-100">Create account</h1>
          <p class="text-sm text-slate-500 mt-1">Join the community to share and discover prompts.</p>
        </div>

        @if (error()) {
          <div class="text-sm text-red-400 px-3 py-2 rounded-lg" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2)">{{ error() }}</div>
        }

        @if (success()) {
          <div class="text-sm text-emerald-400 px-3 py-2 rounded-lg" style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2)">
            Account created! <a routerLink="/auth/login" class="underline">Sign in</a>
          </div>
        } @else {
          <form (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input [(ngModel)]="email" name="email" type="email" autocomplete="email" required
                class="glass-input px-3 py-2.5 text-sm" placeholder="you@example.com" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
              <input [(ngModel)]="username" name="username" type="text" autocomplete="username" required
                class="glass-input px-3 py-2.5 text-sm" placeholder="your_handle" />
              <p class="text-xs text-slate-600 mt-1">Letters, numbers, _ and - only.</p>
            </div>
            <button type="submit" [disabled]="authStore.loading()" class="btn-primary w-full py-2.5 text-sm justify-center">
              {{ authStore.loading() ? 'Creating…' : 'Create account' }}
            </button>
          </form>
        }

        <p class="text-sm text-slate-500 text-center">
          Already have an account? <a routerLink="/auth/login" class="text-indigo-400 hover:text-violet-400 transition-colors">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  username = '';
  readonly error = signal('');
  readonly success = signal(false);

  submit(): void {
    this.error.set('');
    const rawPlan = this.route.snapshot.queryParams['plan'];
    const plan = rawPlan === 'pro' || rawPlan === 'enterprise' ? rawPlan : undefined;
    this.authStore.register(
      this.email,
      this.username,
      () => this.success.set(true),
      (msg) => this.error.set(msg),
      plan,
    );
  }
}
