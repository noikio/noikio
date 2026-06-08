import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { AdminApiService, type AdminStats } from '../../core/api/admin-api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [],
  template: `
    <div class="space-y-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-slate-100">Admin</h1>
          <p class="text-sm text-slate-500 mt-1">Live platform overview</p>
        </div>
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
          Updates every 30s
        </div>
      </div>

      @if (loading() && !stats()) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for (_ of [1,2,3,4,5,6,7,8]; track $index) {
            <div class="glass-card p-5 animate-pulse">
              <div class="w-16 h-3 bg-white/5 rounded mb-3"></div>
              <div class="w-10 h-7 bg-white/5 rounded"></div>
            </div>
          }
        </div>
      }

      @if (stats(); as s) {
        <!-- Online now -->
        <section>
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Live</h2>
          <div class="glass-card p-5 flex items-start gap-6">
            <div>
              <p class="text-xs text-slate-500 mb-1">Online now</p>
              <p class="text-4xl font-bold text-emerald-400">{{ s.online.count }}</p>
            </div>
            @if (s.online.users.length > 0) {
              <div class="flex flex-wrap gap-2 pt-1">
                @for (u of s.online.users; track u.id) {
                  <span class="px-2.5 py-1 rounded-full text-xs font-medium"
                    style="background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.25);color:#6ee7b7">
                    {{ u.username }}
                  </span>
                }
              </div>
            } @else {
              <p class="text-xs text-slate-600 pt-2">No active sessions right now</p>
            }
          </div>
        </section>

        <!-- Key stats -->
        <section>
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Platform</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="glass-card p-5">
              <p class="text-xs text-slate-500 mb-2">Total users</p>
              <p class="text-3xl font-bold text-slate-100">{{ s.users.total }}</p>
              <p class="text-xs text-emerald-400 mt-1">+{{ s.users.new_7d }} this week</p>
            </div>
            <div class="glass-card p-5">
              <p class="text-xs text-slate-500 mb-2">Total prompts</p>
              <p class="text-3xl font-bold text-slate-100">{{ s.prompts.total }}</p>
              <p class="text-xs text-emerald-400 mt-1">+{{ s.prompts.new_7d }} this week</p>
            </div>
            <div class="glass-card p-5">
              <p class="text-xs text-slate-500 mb-2">Public / Private</p>
              <p class="text-3xl font-bold text-slate-100">{{ s.prompts.public }}</p>
              <p class="text-xs text-slate-500 mt-1">{{ s.prompts.private }} private</p>
            </div>
            <div class="glass-card p-5">
              <p class="text-xs text-slate-500 mb-2">Comments</p>
              <p class="text-3xl font-bold text-slate-100">{{ s.engagement.comments }}</p>
              <p class="text-xs text-slate-500 mt-1">{{ s.engagement.ratings }} ratings</p>
            </div>
          </div>
        </section>

        <!-- Top contributors -->
        <section>
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Top contributors</h2>
          <div class="glass-card overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-white/5">
                  <th class="text-left px-4 py-3 text-xs text-slate-500 font-medium">#</th>
                  <th class="text-left px-4 py-3 text-xs text-slate-500 font-medium">User</th>
                  <th class="text-left px-4 py-3 text-xs text-slate-500 font-medium">Email</th>
                  <th class="text-right px-4 py-3 text-xs text-slate-500 font-medium">Prompts</th>
                </tr>
              </thead>
              <tbody>
                @for (u of s.top_users; track u.id; let i = $index) {
                  <tr class="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td class="px-4 py-3 text-slate-600 tabular-nums">{{ i + 1 }}</td>
                    <td class="px-4 py-3 text-slate-200 font-medium">{{ u.username }}</td>
                    <td class="px-4 py-3 text-slate-500 text-xs">{{ u.email }}</td>
                    <td class="px-4 py-3 text-right text-slate-300 tabular-nums font-medium">{{ u.prompt_count }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <!-- Recent signups -->
        <section>
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Recent signups</h2>
          <div class="glass-card overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-white/5">
                  <th class="text-left px-4 py-3 text-xs text-slate-500 font-medium">User</th>
                  <th class="text-left px-4 py-3 text-xs text-slate-500 font-medium">Email</th>
                  <th class="text-right px-4 py-3 text-xs text-slate-500 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                @for (u of s.users.recent; track u.id) {
                  <tr class="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td class="px-4 py-3 text-slate-200 font-medium">{{ u.username }}</td>
                    <td class="px-4 py-3 text-slate-500 text-xs">{{ u.email }}</td>
                    <td class="px-4 py-3 text-right text-slate-500 text-xs tabular-nums">{{ formatDate(u.created_at) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
  `,
})
export class AdminComponent implements OnInit, OnDestroy {
  private readonly api = inject(AdminApiService);

  readonly stats = signal<AdminStats | null>(null);
  readonly loading = signal(true);

  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.load();
    this.sendHeartbeat();

    this.pollInterval = setInterval(() => this.load(), 30_000);
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
  }

  private load(): void {
    this.api.getStats().subscribe({
      next: (s) => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private sendHeartbeat(): void {
    this.api.heartbeat().subscribe();
  }

  formatDate(unix: number): string {
    return new Date(unix * 1000).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
}
