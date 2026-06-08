import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LeaderboardApiService, type Period } from '../../core/api/leaderboard-api.service';
import { UserBadgeComponent } from '../../shared/components/user-badge.component';
import type { LeaderboardEntry } from '../../core/models/index';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [RouterLink, UserBadgeComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-100">Leaderboard</h1>
        <p class="text-sm text-slate-500 mt-1">Top contributors ranked by engagement score.</p>
      </div>

      <!-- Period filter -->
      <div class="flex flex-wrap gap-2">
        @for (p of periods; track p.value) {
          <button
            (click)="setPeriod(p.value)"
            class="px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer"
            [style]="period() === p.value
              ? 'background:rgba(99,102,241,0.25);border:1px solid rgba(99,102,241,0.5);color:#a5b4fc'
              : 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#64748b'"
          >{{ p.label }}</button>
        }
      </div>

      <!-- Score legend -->
      <div class="flex flex-wrap gap-4 text-xs text-slate-500">
        <span class="flex items-center gap-1">
          <svg class="w-3 h-3 text-emerald-400" viewBox="0 0 12 12" fill="currentColor"><path d="M6 1.5 L10.5 7.5 H7.5 V10.5 H4.5 V7.5 H1.5 Z"/></svg>
          Prompt like +2
        </span>
        <span class="flex items-center gap-1">
          <svg class="w-3 h-3 text-red-400" viewBox="0 0 12 12" fill="currentColor"><path d="M6 10.5 L1.5 4.5 H4.5 V1.5 H7.5 V4.5 H10.5 Z"/></svg>
          Prompt dislike −1
        </span>
        <span class="flex items-center gap-1">
          <svg class="w-3 h-3 text-emerald-400" viewBox="0 0 12 12" fill="currentColor"><path d="M6 1.5 L10.5 7.5 H7.5 V10.5 H4.5 V7.5 H1.5 Z"/></svg>
          Comment/reply like +1
        </span>
        <span class="flex items-center gap-1">
          <svg class="w-3 h-3 text-red-400" viewBox="0 0 12 12" fill="currentColor"><path d="M6 10.5 L1.5 4.5 H4.5 V1.5 H7.5 V4.5 H10.5 Z"/></svg>
          Comment/reply dislike −1
        </span>
      </div>

      @if (loading()) {
        <div class="space-y-2">
          @for (_ of [1,2,3,4,5]; track $index) {
            <div class="glass-card p-4 animate-pulse flex items-center gap-4">
              <div class="w-8 h-4 bg-white/5 rounded"></div>
              <div class="w-24 h-4 bg-white/5 rounded"></div>
              <div class="flex-1"></div>
              <div class="w-16 h-4 bg-white/5 rounded"></div>
            </div>
          }
        </div>
      } @else if (entries().length === 0) {
        <div class="text-center py-16 text-slate-500 text-sm">No activity yet for this period.</div>
      } @else {
        <div class="space-y-2">
          @for (entry of entries(); track entry.user_id) {
            <a
              [routerLink]="['/users', entry.username]"
              class="glass-card p-4 flex items-center gap-4 hover:border-indigo-500/30 transition-colors group block"
              [style]="entry.rank <= 3 ? podiumStyle(entry.rank) : ''"
            >
              <!-- Rank -->
              <div class="w-8 text-center shrink-0">
                @if (entry.rank <= 3) {
                  <app-user-badge [rank]="asRank(entry.rank)" />
                } @else {
                  <span class="text-xs text-slate-500 font-mono">#{{ entry.rank }}</span>
                }
              </div>

              <!-- Username -->
              <span class="text-sm font-medium group-hover:text-white transition-colors"
                [class]="entry.rank === 1 ? 'text-amber-300' : entry.rank === 2 ? 'text-slate-300' : entry.rank === 3 ? 'text-amber-700' : 'text-slate-300'">
                {{ entry.username }}
              </span>

              <div class="flex-1"></div>

              <!-- Prompt count -->
              <span class="text-xs text-slate-600 hidden sm:inline">{{ entry.prompt_count }} prompt{{ entry.prompt_count !== 1 ? 's' : '' }}</span>

              <!-- Score -->
              <span class="text-sm font-semibold tabular-nums"
                [class]="entry.total_score >= 0 ? 'text-emerald-400' : 'text-red-400'">
                {{ entry.total_score >= 0 ? '+' : '' }}{{ entry.total_score }}
              </span>
            </a>
          }
        </div>

        <!-- Badge note -->
        <p class="text-xs text-slate-600 text-center pt-2">
          ★ badges are awarded to this month's top 3 and displayed across their prompts, comments and replies
        </p>
      }
    </div>
  `,
})
export class LeaderboardComponent implements OnInit {
  private readonly api = inject(LeaderboardApiService);

  readonly periods = PERIODS;
  readonly period = signal<Period>('month');
  readonly entries = signal<LeaderboardEntry[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  setPeriod(p: Period): void {
    this.period.set(p);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.getLeaderboard(this.period()).subscribe({
      next: (data) => { this.entries.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  asRank(n: number): 1 | 2 | 3 {
    return n as 1 | 2 | 3;
  }

  podiumStyle(rank: number): string {
    if (rank === 1) return 'border-color:rgba(251,191,36,0.25);background:rgba(251,191,36,0.04)';
    if (rank === 2) return 'border-color:rgba(148,163,184,0.25);background:rgba(148,163,184,0.04)';
    return 'border-color:rgba(180,83,9,0.2);background:rgba(180,83,9,0.04)';
  }
}
