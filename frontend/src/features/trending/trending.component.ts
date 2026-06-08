import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TrendingApiService } from '../../core/api/trending-api.service';
import type { Prompt } from '../../core/models/index';

type Period = '24h' | '7d' | '30d';

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

@Component({
  selector: 'app-trending',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold text-slate-100">Trending Prompts</h1>
        <div class="flex gap-1 bg-white/5 rounded-lg p-1">
          @for (p of periods; track p.value) {
            <button
              (click)="setPeriod(p.value)"
              class="cursor-pointer px-3 py-1 rounded-md text-xs font-medium transition-colors duration-150"
              [class]="period() === p.value
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'"
            >{{ p.label }}</button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="glass-card p-4 animate-pulse flex gap-4">
              <div class="w-8 h-4 bg-white/5 rounded shrink-0"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-white/5 rounded w-3/4"></div>
                <div class="h-3 bg-white/5 rounded w-1/2"></div>
              </div>
            </div>
          }
        </div>
      } @else if (prompts().length === 0) {
        <div class="text-center py-16 space-y-3">
          <svg class="w-10 h-10 text-slate-700 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
          <p class="text-sm text-slate-500">No trending prompts for this period.</p>
        </div>
      } @else {
        <div class="space-y-2">
          @for (prompt of prompts(); track prompt.id; let i = $index) {
            <a
              [routerLink]="['/discover', prompt.id]"
              class="glass-card p-4 flex items-start gap-4 hover:border-indigo-500/30 transition-colors duration-150 group cursor-pointer block"
            >
              <span class="text-lg font-bold tabular-nums text-slate-600 w-7 text-right shrink-0 leading-tight pt-0.5">
                {{ i + 1 }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <h2 class="text-sm font-medium text-slate-200 group-hover:text-white transition-colors duration-150 truncate">
                    {{ prompt.title }}
                  </h2>
                  <div class="flex items-center gap-3 shrink-0 text-xs text-slate-500">
                    <span class="flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M1 8.25a1.25 1.25 0 1 1 2.5 0v7.5a1.25 1.25 0 0 1-2.5 0v-7.5ZM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0 1 14 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 0 1-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 0 1-1.341-.317l-2.734-1.366A3 3 0 0 0 6.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 0 1 2.166-1.73c.432-.143.853-.386 1.011-.76A2.8 2.8 0 0 0 11 3Z"/>
                      </svg>
                      {{ prompt.like_count ?? 0 }}
                    </span>
                    @if (prompt.view_count) {
                      <span class="flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                        </svg>
                        {{ prompt.view_count }}
                      </span>
                    }
                  </div>
                </div>
                @if (prompt.description) {
                  <p class="text-xs text-slate-500 mt-1 line-clamp-1">{{ prompt.description }}</p>
                }
                <div class="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
                  @if (prompt.creator_username) {
                    <span>&#64;{{ prompt.creator_username }}</span>
                    <span>&middot;</span>
                  }
                  <span>{{ timeAgo(prompt.updated_at) }}</span>
                </div>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class TrendingComponent implements OnInit {
  private readonly api = inject(TrendingApiService);

  readonly period = signal<Period>('7d');
  readonly loading = signal(true);
  readonly prompts = signal<Prompt[]>([]);
  readonly timeAgo = timeAgo;

  readonly periods: { value: Period; label: string }[] = [
    { value: '24h', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
  ];

  ngOnInit() {
    this.load();
  }

  setPeriod(p: Period) {
    this.period.set(p);
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.api.get(this.period(), 20).subscribe({
      next: (data) => { this.prompts.set(data); this.loading.set(false); },
      error: () => { this.prompts.set([]); this.loading.set(false); },
    });
  }
}
