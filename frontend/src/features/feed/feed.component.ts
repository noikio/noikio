import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedApiService } from '../../core/api/feed-api.service';
import { TrendingApiService } from '../../core/api/trending-api.service';
import { TagStore } from '../../state/tag.store';
import { AuthStore } from '../../state/auth.store';
import { TagBadgeComponent } from '../../shared/components/tag-badge.component';
import type { Prompt } from '../../core/models/index';

type Tab = 'foryou' | 'trending';
type Period = '24h' | '7d' | '30d';

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [RouterLink, TagBadgeComponent],
  template: `
    <div class="space-y-5">

      <!-- Tab bar -->
      <div class="flex items-center justify-between">
        <div class="flex gap-1 bg-white/5 rounded-lg p-1">
          <button
            (click)="setTab('foryou')"
            class="cursor-pointer px-4 py-1.5 rounded-md text-xs font-medium transition-colors duration-150"
            [class]="tab() === 'foryou' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
          >For You</button>
          <button
            (click)="setTab('trending')"
            class="cursor-pointer px-4 py-1.5 rounded-md text-xs font-medium transition-colors duration-150"
            [class]="tab() === 'trending' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
          >Trending</button>
        </div>

        @if (tab() === 'trending') {
          <div class="flex gap-1 bg-white/5 rounded-lg p-1">
            @for (p of periods; track p.value) {
              <button
                (click)="setPeriod(p.value)"
                class="cursor-pointer px-3 py-1 rounded-md text-xs font-medium transition-colors duration-150"
                [class]="period() === p.value ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'"
              >{{ p.label }}</button>
            }
          </div>
        } @else {
          <span class="text-xs text-slate-600">
            @if (authStore.isAuthenticated()) { from people you follow } @else { top prompts }
          </span>
        }
      </div>

      <!-- For You tab -->
      @if (tab() === 'foryou') {
        @if (feedLoading() && feedItems().length === 0) {
          <div class="space-y-4">
            @for (i of [1,2,3]; track i) {
              <div class="glass-card p-5 space-y-3 animate-pulse">
                <div class="h-4 bg-white/5 rounded w-3/4"></div>
                <div class="h-3 bg-white/5 rounded w-1/2"></div>
                <div class="h-3 bg-white/5 rounded w-full"></div>
              </div>
            }
          </div>
        } @else if (feedItems().length === 0) {
          <div class="text-center py-16 space-y-4">
            <p class="text-slate-500 text-sm">
              @if (authStore.isAuthenticated()) {
                Follow some users to see their prompts here.
              } @else {
                <a routerLink="/auth/register" class="text-indigo-400 hover:text-violet-400 transition-colors">Join noikio</a> to get started.
              }
            </p>
            <a routerLink="/discover" class="btn-primary px-4 py-2 text-xs inline-block">Explore Discover →</a>
          </div>
        } @else {
          <div class="space-y-3">
            @for (item of feedItems(); track item.id) {
              <a [routerLink]="['/discover', item.id]" class="glass-card p-5 block hover:border-indigo-500/30 transition-colors duration-150 group cursor-pointer">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <h2 class="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors duration-150 truncate">{{ item.title }}</h2>
                    @if (item.description) {
                      <p class="text-xs text-slate-500 mt-1 line-clamp-2">{{ item.description }}</p>
                    }
                    <div class="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      @if (item.creator_username) {
                        <a [routerLink]="['/users', item.creator_username]" class="hover:text-slate-300 transition-colors" (click)="$event.stopPropagation()">
                          &#64;{{ item.creator_username }}
                        </a>
                      }
                      <span>{{ timeAgo(item.created_at) }}</span>
                      @if ((item.view_count ?? 0) > 0) {
                        <span class="flex items-center gap-1">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                          </svg>
                          {{ item.view_count }}
                        </span>
                      }
                    </div>
                  </div>
                  <span class="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M1 8.25a1.25 1.25 0 1 1 2.5 0v7.5a1.25 1.25 0 0 1-2.5 0v-7.5ZM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0 1 14 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 0 1-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 0 1-1.341-.317l-2.734-1.366A3 3 0 0 0 6.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 0 1 2.166-1.73c.432-.143.853-.386 1.011-.76A2.8 2.8 0 0 0 11 3Z"/>
                    </svg>
                    {{ item.like_count }}
                  </span>
                </div>
                @if (item.tag_ids.length > 0) {
                  <div class="flex flex-wrap gap-1 mt-3">
                    @for (tagId of item.tag_ids.slice(0, 4); track tagId) {
                      @if (tagStore.tagMap().get(tagId); as tag) {
                        <app-tag-badge [tag]="tag" />
                      }
                    }
                    @if (item.tag_ids.length > 4) {
                      <span class="text-xs text-slate-600 py-0.5 px-1">+{{ item.tag_ids.length - 4 }}</span>
                    }
                  </div>
                }
              </a>
            }
          </div>
          @if (nextCursor() !== null) {
            <div class="flex justify-center pt-2">
              <button (click)="loadMore()" [disabled]="feedLoading()"
                class="btn-ghost px-6 py-2 text-xs cursor-pointer">
                {{ feedLoading() ? 'Loading…' : 'Load more' }}
              </button>
            </div>
          }
        }
      }

      <!-- Trending tab -->
      @if (tab() === 'trending') {
        @if (trendingLoading()) {
          <div class="space-y-2">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="glass-card p-4 animate-pulse flex gap-4">
                <div class="w-6 h-4 bg-white/5 rounded shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-white/5 rounded w-3/4"></div>
                  <div class="h-3 bg-white/5 rounded w-1/2"></div>
                </div>
              </div>
            }
          </div>
        } @else if (trendingItems().length === 0) {
          <div class="text-center py-16">
            <p class="text-sm text-slate-500">No trending prompts for this period.</p>
          </div>
        } @else {
          <div class="space-y-2">
            @for (prompt of trendingItems(); track prompt.id; let i = $index) {
              <a
                [routerLink]="['/discover', prompt.id]"
                class="glass-card p-4 flex items-start gap-4 hover:border-indigo-500/30 transition-colors duration-150 group cursor-pointer block"
              >
                <span class="text-lg font-bold tabular-nums text-slate-600 w-7 text-right shrink-0 leading-tight pt-0.5">{{ i + 1 }}</span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-3">
                    <h2 class="text-sm font-medium text-slate-200 group-hover:text-white transition-colors duration-150 truncate">{{ prompt.title }}</h2>
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
      }

    </div>
  `,
})
export class FeedComponent implements OnInit {
  private readonly feedApi = inject(FeedApiService);
  private readonly trendingApi = inject(TrendingApiService);
  readonly tagStore = inject(TagStore);
  readonly authStore = inject(AuthStore);

  readonly tab = signal<Tab>('foryou');
  readonly period = signal<Period>('7d');

  readonly feedItems = signal<Prompt[]>([]);
  readonly feedLoading = signal(true);
  readonly nextCursor = signal<number | null>(null);

  readonly trendingItems = signal<Prompt[]>([]);
  readonly trendingLoading = signal(false);

  readonly timeAgo = timeAgo;
  readonly periods: { value: Period; label: string }[] = [
    { value: '24h', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
  ];

  ngOnInit(): void {
    this.tagStore.load();
    this.loadFeed();
  }

  setTab(t: Tab): void {
    if (this.tab() === t) return;
    this.tab.set(t);
    if (t === 'trending' && this.trendingItems().length === 0) {
      this.loadTrending();
    }
  }

  setPeriod(p: Period): void {
    this.period.set(p);
    this.loadTrending();
  }

  private loadFeed(cursor?: number): void {
    this.feedLoading.set(true);
    this.feedApi.get(cursor).subscribe({
      next: (res) => {
        this.feedItems.update(prev => cursor ? [...prev, ...res.items] : res.items);
        this.nextCursor.set(res.next_cursor);
        this.feedLoading.set(false);
      },
      error: () => this.feedLoading.set(false),
    });
  }

  private loadTrending(): void {
    this.trendingLoading.set(true);
    this.trendingApi.get(this.period(), 20).subscribe({
      next: (data) => { this.trendingItems.set(data); this.trendingLoading.set(false); },
      error: () => { this.trendingItems.set([]); this.trendingLoading.set(false); },
    });
  }

  loadMore(): void {
    const cursor = this.nextCursor();
    if (cursor != null) this.loadFeed(cursor);
  }
}
