import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookmarksApiService } from '../../core/api/bookmarks-api.service';
import { TagStore } from '../../state/tag.store';
import { TagBadgeComponent } from '../../shared/components/tag-badge.component';
import type { Prompt } from '../../core/models/index';

@Component({
  selector: 'app-bookmarks',
  standalone: true,
  imports: [RouterLink, TagBadgeComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold text-slate-100">Bookmarks</h1>
        <span class="text-xs text-slate-500">{{ items().length }} saved</span>
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3]; track i) {
            <div class="glass-card p-4 animate-pulse space-y-2">
              <div class="h-4 bg-white/5 rounded w-3/4"></div>
              <div class="h-3 bg-white/5 rounded w-1/2"></div>
            </div>
          }
        </div>
      } @else if (items().length === 0) {
        <div class="text-center py-16 space-y-3">
          <svg class="w-10 h-10 text-slate-700 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p class="text-sm text-slate-500">No bookmarks yet.</p>
          <a routerLink="/discover" class="btn-primary px-4 py-2 text-xs inline-block">Explore prompts →</a>
        </div>
      } @else {
        <div class="space-y-3">
          @for (item of items(); track item.id) {
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
    </div>
  `,
})
export class BookmarksComponent implements OnInit {
  private readonly api = inject(BookmarksApiService);
  readonly tagStore = inject(TagStore);

  readonly items = signal<Prompt[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.tagStore.load();
    this.api.getAll().subscribe({
      next: (prompts) => { this.items.set(prompts); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  removeBookmark(promptId: number): void {
    this.api.remove(promptId).subscribe(() => {
      this.items.update(list => list.filter(p => p.id !== promptId));
    });
  }
}
