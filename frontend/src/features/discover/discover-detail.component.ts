import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { PromptApiService } from '../../core/api/prompt-api.service';
import { BookmarksApiService } from '../../core/api/bookmarks-api.service';
import { TagStore } from '../../state/tag.store';
import { AuthStore } from '../../state/auth.store';
import { TagBadgeComponent } from '../../shared/components/tag-badge.component';
import { CopyButtonComponent } from '../../shared/components/copy-button.component';
import { RequirementsDisplayComponent } from '../../shared/components/requirements-display.component';
import { RatingComponent } from '../../shared/components/rating.component';
import { CommentsComponent } from '../../shared/components/comments.component';
import type { Prompt, PromptRequirements } from '../../core/models/index';

const VEM_BASE = 'https://vem.dev';

@Component({
  selector: 'app-discover-detail',
  standalone: true,
  imports: [
    RouterLink,
    TagBadgeComponent,
    CopyButtonComponent,
    RequirementsDisplayComponent,
    RatingComponent,
    CommentsComponent,
  ],
  template: `
    @if (prompt()) {
      <div class="max-w-3xl mx-auto space-y-5">
        <div>
          <a
            routerLink="/discover"
            class="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-3 transition-colors"
          >
            <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M7.78 2.22a.75.75 0 0 1 0 1.06L5.06 6l2.72 2.72a.75.75 0 1 1-1.06 1.06L3.47 6.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z"/>
            </svg>
            Discover
          </a>

          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <h1 class="text-2xl font-semibold text-slate-100">{{ prompt()!.title }}</h1>
              @if (prompt()!.description) {
                <p class="text-sm text-slate-400 mt-1">{{ prompt()!.description }}</p>
              }
              <div class="flex items-center gap-3 mt-1 flex-wrap">
                @if (prompt()!.creator_username) {
                  <a [routerLink]="['/users', prompt()!.creator_username]"
                    class="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                    by {{ prompt()!.creator_username }}
                  </a>
                }
                @if ((prompt()!.view_count ?? 0) > 0) {
                  <span class="text-xs text-slate-700">{{ prompt()!.view_count }} views</span>
                }
                @if ((prompt()!.fork_count ?? 0) > 0) {
                  <span class="text-xs text-slate-700 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                      <path fill-rule="evenodd" d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h1.5v2.128a2.251 2.251 0 1 0 1.5 0V8.5h1.5a2.25 2.25 0 0 0 2.25-2.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 6.25v-.878zm3.75 7.378a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm3-8.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z"/>
                    </svg>
                    {{ prompt()!.fork_count }} forks
                  </span>
                }
                @if ((prompt()!.vem_use_count ?? 0) > 0) {
                  <span class="text-xs text-emerald-600 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0zm6.39-2.908a.75.75 0 0 1 .766.027l3.5 2.25a.75.75 0 0 1 0 1.262l-3.5 2.25A.75.75 0 0 1 8 12.25v-4.5a.75.75 0 0 1 .39-.658z" clip-rule="evenodd"/>
                    </svg>
                    Used in {{ prompt()!.vem_use_count }} vem projects
                  </span>
                }
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-2 shrink-0 mt-1 flex-wrap justify-end">
              <!-- Share -->
              <app-copy-button [isShare]="true" [text]="shareUrl()" />

              <!-- Bookmark -->
              @if (authStore.isAuthenticated()) {
                <button (click)="toggleBookmark()"
                  [title]="bookmarked() ? 'Remove bookmark' : 'Bookmark'"
                  class="p-1.5 rounded-lg border transition-all text-xs"
                  [class]="bookmarked()
                    ? 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10'
                    : 'border-white/10 text-slate-500 hover:border-indigo-500/30 hover:text-indigo-400'">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14l-5-2.5L5 18V4z"/>
                  </svg>
                </button>

                <!-- Fork -->
                <button (click)="fork()" [disabled]="forking()"
                  title="Fork & Remix"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:border-indigo-500/30 hover:text-indigo-400 transition-all text-xs">
                  <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h1.5v2.128a2.251 2.251 0 1 0 1.5 0V8.5h1.5a2.25 2.25 0 0 0 2.25-2.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 6.25v-.878zm3.75 7.378a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm3-8.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z"/>
                  </svg>
                  {{ forking() ? 'Forking…' : 'Fork' }}
                </button>
              }
            </div>
          </div>

          @if (prompt()!.tag_ids.length > 0) {
            <div class="flex flex-wrap gap-1.5 mt-3">
              @for (tagId of prompt()!.tag_ids; track tagId) {
                @if (tagStore.tagMap().get(tagId); as tag) {
                  <app-tag-badge [tag]="tag" />
                }
              }
            </div>
          }
        </div>

        <!-- vem.dev CTA -->
        <div class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-emerald-400">Run this prompt with vem.dev</p>
            <p class="text-xs text-slate-500 mt-0.5">Manage, validate, and chain AI agents in one place.</p>
          </div>
          <button (click)="runInVem()" [disabled]="runningVem()"
            class="shrink-0 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            @if (runningVem()) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            } @else {
              <svg class="w-4 h-4" viewBox="0 0 120 120" fill="none" aria-hidden="true">
                <rect x="18" y="46" width="74" height="44" rx="12" stroke="#4ade80" stroke-width="6" opacity="0.9"/>
                <rect x="30" y="32" width="74" height="44" rx="12" stroke="rgb(0,211,242)" stroke-width="6" opacity="0.6"/>
                <rect x="42" y="18" width="74" height="44" rx="12" stroke="rgb(0,211,242)" stroke-width="6" opacity="0.35"/>
              </svg>
            }
            {{ runningVem() ? 'Opening…' : 'Run in vem' }}
          </button>
        </div>

        <!-- Rating (only if authenticated) -->
        @if (authStore.isAuthenticated()) {
          <div class="flex items-center gap-4 mb-3">
            <span class="text-xs text-slate-500">Rate this prompt:</span>
            <app-rating
              [promptId]="prompt()!.id"
              [likes]="likes()"
              [dislikes]="dislikes()"
              [initialRating]="prompt()!.user_rating"
              (ratingChange)="onRatingChange($event)"
            />
          </div>
        } @else {
          <p class="text-xs text-slate-600 flex items-center gap-2">
            <a routerLink="/auth/login" class="text-indigo-400 hover:text-violet-400 transition-colors">Sign in</a>
            <span>to rate, bookmark, and fork this prompt.</span>
            <span class="inline-flex items-center gap-1">
              <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M1 8.25a1.25 1.25 0 1 1 2.5 0v7.5a1.25 1.25 0 0 1-2.5 0v-7.5ZM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0 1 14 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 0 1-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 0 1-1.341-.317l-2.734-1.366A3 3 0 0 0 6.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 0 1 2.166-1.73c.432-.143.853-.386 1.011-.76A2.8 2.8 0 0 0 11 3Z"/>
              </svg>
              {{ likes() }}
            </span>
          </p>
        }

        @if (prompt()!.requirements) {
          <app-requirements-display [req]="prompt()!.requirements!" />
        }

        <!-- Content -->
        <div class="glass-card overflow-hidden">
          <div class="flex items-center justify-between px-5 py-3" style="border-bottom:1px solid rgba(255,255,255,0.06)">
            <span class="section-label">Content</span>
            <app-copy-button [text]="prompt()!.content" />
          </div>
          <pre class="px-5 py-4 whitespace-pre-wrap text-sm text-slate-300 leading-relaxed overflow-x-auto"
            style="font-family:'JetBrains Mono',ui-monospace,monospace">{{ prompt()!.content }}</pre>
        </div>

        <!-- Comments -->
        <app-comments
          [promptId]="prompt()!.id"
          [isAuthenticated]="authStore.isAuthenticated()"
          [currentUser]="authStore.currentUser()?.username ?? null"
        />
      </div>
    } @else if (loading()) {
      <div class="flex items-center justify-center py-24">
        <svg class="w-5 h-5 text-slate-600 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    } @else {
      <div class="text-center py-24 text-slate-500 text-sm">Prompt not found.</div>
    }
  `,
})
export class DiscoverDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(PromptApiService);
  private readonly bookmarksApi = inject(BookmarksApiService);
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  readonly tagStore = inject(TagStore);
  readonly authStore = inject(AuthStore);

  readonly prompt = signal<Prompt | null>(null);
  readonly loading = signal(true);
  readonly likes = signal(0);
  readonly dislikes = signal(0);
  readonly bookmarked = signal(false);
  readonly forking = signal(false);

  readonly runningVem = signal(false);
  readonly shareUrl = computed(() => `${window.location.origin}/discover/${this.prompt()?.id ?? ''}`);

  ngOnInit(): void {
    this.tagStore.load();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getPublic(id).subscribe({
      next: (p) => {
        this.prompt.set(p);
        this.likes.set(p.like_count);
        this.dislikes.set(p.dislike_count);
        this.bookmarked.set(p.bookmarked ?? false);
        this.loading.set(false);
        // Set OG meta tags
        this.titleService.setTitle(`${p.title} — noikio`);
        this.meta.updateTag({ property: 'og:title', content: p.title });
        this.meta.updateTag({ property: 'og:description', content: p.description || `A prompt by ${p.creator_username ?? 'noikio'} · ${p.like_count} likes` });
        this.meta.updateTag({ property: 'og:url', content: this.shareUrl() });
        this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
        this.meta.updateTag({ name: 'twitter:title', content: p.title });
        this.meta.updateTag({ name: 'twitter:description', content: p.description || `${p.like_count} likes on noikio` });
      },
      error: () => this.loading.set(false),
    });
  }

  onRatingChange(_event: { likes: number; dislikes: number; userRating: 'like' | 'dislike' | null }): void {
    const id = this.prompt()?.id;
    if (!id) return;
    this.api.getPublic(id).subscribe((p) => {
      this.likes.set(p.like_count);
      this.dislikes.set(p.dislike_count);
    });
  }

  toggleBookmark(): void {
    const id = this.prompt()?.id;
    if (!id) return;
    const action = this.bookmarked()
      ? this.bookmarksApi.remove(id)
      : this.bookmarksApi.add(id);
    action.subscribe(res => this.bookmarked.set(res.bookmarked));
  }

  fork(): void {
    const id = this.prompt()?.id;
    if (!id || this.forking()) return;
    this.forking.set(true);
    this.api.fork(id).subscribe({
      next: (res) => {
        this.forking.set(false);
        this.router.navigate(['/prompts', res.id, 'edit']);
      },
      error: () => this.forking.set(false),
    });
  }

  runInVem(): void {
    const current = this.prompt();
    if (!current || this.runningVem()) return;
    this.runningVem.set(true);
    this.api.generateRunToken(current.id).subscribe({
      next: ({ token }) => {
        this.prompt.set({ ...current, vem_use_count: (current.vem_use_count ?? 0) + 1 });
        window.open(`${VEM_BASE}/run?prompt_source=noikio&prompt_token=${token}`, '_blank', 'noopener');
        this.runningVem.set(false);
      },
      error: () => this.runningVem.set(false),
    });
  }
}
