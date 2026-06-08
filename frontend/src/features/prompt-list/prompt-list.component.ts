import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PromptStore } from '../../state/prompt.store';
import { TagStore } from '../../state/tag.store';
import { SearchStore } from '../../state/search.store';
import { BookmarksApiService } from '../../core/api/bookmarks-api.service';
import { TagBadgeComponent } from '../../shared/components/tag-badge.component';
import type { Prompt } from '../../core/models/index';

type Tab = 'prompts' | 'bookmarks';

@Component({
  selector: 'app-prompt-list',
  standalone: true,
  imports: [RouterLink, FormsModule, TagBadgeComponent],
  template: `
    <div class="max-w-4xl mx-auto">

      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <div class="flex gap-1 bg-white/5 rounded-lg p-1">
          <button
            (click)="setTab('prompts')"
            class="cursor-pointer px-4 py-1.5 rounded-md text-xs font-medium transition-colors duration-150"
            [class]="tab() === 'prompts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
          >My Prompts</button>
          <button
            (click)="setTab('bookmarks')"
            class="cursor-pointer px-4 py-1.5 rounded-md text-xs font-medium transition-colors duration-150"
            [class]="tab() === 'bookmarks' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'"
          >
            Bookmarks
            @if (bookmarks().length > 0) {
              <span class="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] leading-none"
                [class]="tab() === 'bookmarks' ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'"
              >{{ bookmarks().length }}</span>
            }
          </button>
        </div>
        @if (tab() === 'prompts') {
          <a routerLink="/prompts/new" class="btn-primary px-4 py-2">
            <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z"/>
            </svg>
            New Prompt
          </a>
        }
      </div>

      <!-- My Prompts tab -->
      @if (tab() === 'prompts') {
        <div class="relative mb-5">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
            viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/>
          </svg>
          <input
            type="search"
            [ngModel]="searchInput()"
            (ngModelChange)="onSearch($event)"
            placeholder="Search prompts..."
            class="glass-input pl-10 pr-4 py-2.5 text-sm"
          />
        </div>

        @if (promptStore.loading()) {
          <div class="space-y-2">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="glass-card p-5 animate-pulse">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 space-y-2">
                    <div class="h-3.5 rounded-md w-2/5" style="background:rgba(255,255,255,0.07)"></div>
                    <div class="h-3 rounded-md w-3/5" style="background:rgba(255,255,255,0.04)"></div>
                  </div>
                  <div class="h-3 rounded-md w-14 shrink-0" style="background:rgba(255,255,255,0.04)"></div>
                </div>
              </div>
            }
          </div>
        } @else if (promptStore.prompts().length === 0) {
          <div class="text-center py-24">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 glass-card">
              <svg class="w-7 h-7 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
              </svg>
            </div>
            @if (searchInput()) {
              <p class="text-slate-400 text-sm mb-2">No results for "<span class="text-slate-300">{{ searchInput() }}</span>"</p>
              <button (click)="onSearch('')" class="text-sm text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">Clear search</button>
            } @else {
              <p class="text-slate-400 text-sm mb-1">Your library is empty.</p>
              <p class="text-slate-600 text-xs mb-4">Create your first prompt to get started.</p>
              <a routerLink="/prompts/new" class="btn-primary px-4 py-2 text-sm">
                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z"/>
                </svg>
                Create prompt
              </a>
            }
          </div>
        } @else {
          <div class="space-y-2">
            @for (prompt of promptStore.prompts(); track prompt.id) {
              <a [routerLink]="['/prompts', prompt.id]" class="glass-card glass-card-hover group flex cursor-pointer overflow-hidden">
                <div class="w-1 shrink-0 rounded-l-2xl transition-all duration-300"
                  [style]="'background:' + (prompt.visibility === 'public' ? 'linear-gradient(to bottom,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.07)')">
                </div>
                <div class="flex-1 px-5 py-4 min-w-0">
                  <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2 min-w-0">
                        <h2 class="text-sm font-semibold text-slate-200 group-hover:text-white truncate transition-colors duration-200">{{ prompt.title }}</h2>
                        @if (prompt.visibility === 'public') {
                          <span class="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style="background:rgba(99,102,241,0.15);color:#a5b4fc;border:1px solid rgba(99,102,241,0.25)">Public</span>
                        }
                      </div>
                      @if (prompt.description) {
                        <p class="text-xs text-slate-500 mt-0.5 line-clamp-1">{{ prompt.description }}</p>
                      }
                    </div>
                    <div class="flex items-center gap-3 shrink-0 mt-0.5">
                      @if (prompt.visibility === 'public') {
                        <button [routerLink]="['/discover', prompt.id]"
                          (click)="$event.preventDefault(); $event.stopPropagation()"
                          class="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          title="View in Discover">
                          <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path d="M8 2C4.5 2 1.5 4.5 1.5 8s3 6 6.5 6 6.5-2.5 6.5-6-3-6-6.5-6Zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"/>
                          </svg>
                          View
                        </button>
                      }
                      @if (prompt.visibility === 'public' && prompt.like_count > 0) {
                        <span class="flex items-center gap-1 text-xs text-slate-600">
                          <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path d="M1 8.25a1.25 1.25 0 1 1 2.5 0v7.5a1.25 1.25 0 0 1-2.5 0v-7.5ZM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0 1 14 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 0 1-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 0 1-1.341-.317l-2.734-1.366A3 3 0 0 0 6.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 0 1 2.166-1.73c.432-.143.853-.386 1.011-.76A2.8 2.8 0 0 0 11 3Z"/>
                          </svg>
                          {{ prompt.like_count }}
                        </span>
                      }
                      <time class="text-xs text-slate-600 font-mono tabular-nums">{{ formatDate(prompt.updated_at) }}</time>
                    </div>
                  </div>
                  @if (prompt.tag_ids.length > 0) {
                    <div class="flex flex-wrap gap-1.5 mt-3">
                      @for (tagId of prompt.tag_ids; track tagId) {
                        @if (tagStore.tagMap().get(tagId); as tag) {
                          <app-tag-badge [tag]="tag" />
                        }
                      }
                    </div>
                  }
                </div>
              </a>
            }
          </div>
        }
      }

      <!-- Bookmarks tab -->
      @if (tab() === 'bookmarks') {
        @if (bookmarksLoading()) {
          <div class="space-y-3">
            @for (i of [1,2,3]; track i) {
              <div class="glass-card p-4 animate-pulse space-y-2">
                <div class="h-4 bg-white/5 rounded w-3/4"></div>
                <div class="h-3 bg-white/5 rounded w-1/2"></div>
              </div>
            }
          </div>
        } @else if (bookmarks().length === 0) {
          <div class="text-center py-16 space-y-3">
            <svg class="w-10 h-10 text-slate-700 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
            <p class="text-sm text-slate-500">No bookmarks yet.</p>
            <a routerLink="/discover" class="btn-primary px-4 py-2 text-xs inline-block">Explore prompts →</a>
          </div>
        } @else {
          <div class="space-y-3">
            @for (item of bookmarks(); track item.id) {
              <div class="glass-card p-4 hover:border-indigo-500/30 transition-colors duration-150 group relative">
                <a [routerLink]="['/discover', item.id]" class="block pr-8 cursor-pointer">
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="text-sm font-medium text-slate-200 group-hover:text-white transition-colors duration-150 leading-snug">{{ item.title }}</h3>
                    <span class="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M1 8.25a1.25 1.25 0 1 1 2.5 0v7.5a1.25 1.25 0 0 1-2.5 0v-7.5ZM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0 1 14 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 0 1-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 0 1-1.341-.317l-2.734-1.366A3 3 0 0 0 6.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 0 1 2.166-1.73c.432-.143.853-.386 1.011-.76A2.8 2.8 0 0 0 11 3Z"/>
                      </svg>
                      {{ item.like_count ?? 0 }}
                    </span>
                  </div>
                  @if (item.description) {
                    <p class="text-xs text-slate-500 mt-1 line-clamp-2">{{ item.description }}</p>
                  }
                  @if (item.creator_username) {
                    <p class="text-xs text-slate-500 mt-1">&#64;{{ item.creator_username }}</p>
                  }
                  @if (item.tag_ids.length > 0) {
                    <div class="flex flex-wrap gap-1 mt-3">
                      @for (tagId of item.tag_ids.slice(0, 3); track tagId) {
                        @if (tagStore.tagMap().get(tagId); as tag) {
                          <app-tag-badge [tag]="tag" />
                        }
                      }
                      @if (item.tag_ids.length > 3) {
                        <span class="text-xs text-slate-600 self-center">+{{ item.tag_ids.length - 3 }}</span>
                      }
                    </div>
                  }
                </a>
                <button
                  (click)="removeBookmark(item.id)"
                  class="absolute top-3.5 right-3.5 p-1.5 rounded-md cursor-pointer text-slate-600 hover:text-red-400 hover:bg-white/5 transition-colors duration-150"
                  title="Remove bookmark"
                  aria-label="Remove bookmark"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        }
      }

    </div>
  `,
})
export class PromptListComponent implements OnInit {
  readonly promptStore = inject(PromptStore);
  readonly tagStore = inject(TagStore);
  private readonly searchStore = inject(SearchStore);
  private readonly bookmarksApi = inject(BookmarksApiService);

  readonly tab = signal<Tab>('prompts');
  readonly searchInput = signal('');

  readonly bookmarks = signal<Prompt[]>([]);
  readonly bookmarksLoading = signal(false);
  readonly bookmarksLoaded = signal(false);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.promptStore.load();
    this.tagStore.load();
  }

  setTab(t: Tab): void {
    if (this.tab() === t) return;
    this.tab.set(t);
    if (t === 'bookmarks' && !this.bookmarksLoaded()) {
      this.loadBookmarks();
    }
  }

  private loadBookmarks(): void {
    this.bookmarksLoading.set(true);
    this.bookmarksApi.getAll().subscribe({
      next: (items) => { this.bookmarks.set(items); this.bookmarksLoading.set(false); this.bookmarksLoaded.set(true); },
      error: () => { this.bookmarksLoading.set(false); this.bookmarksLoaded.set(true); },
    });
  }

  removeBookmark(promptId: number): void {
    this.bookmarksApi.remove(promptId).subscribe(() => {
      this.bookmarks.update(list => list.filter(p => p.id !== promptId));
    });
  }

  onSearch(q: string): void {
    this.searchInput.set(q);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchStore.setQuery(q);
      this.promptStore.load(q || undefined);
    }, 300);
  }

  formatDate(unixSecs: number): string {
    return new Date(unixSecs * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
