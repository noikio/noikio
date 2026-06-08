import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PromptStore } from '../../state/prompt.store';
import { TagStore } from '../../state/tag.store';
import { AuthStore } from '../../state/auth.store';
import { VersionApiService } from '../../core/api/version-api.service';
import { PromptApiService } from '../../core/api/prompt-api.service';
import { TagBadgeComponent } from '../../shared/components/tag-badge.component';
import { CopyButtonComponent } from '../../shared/components/copy-button.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { RequirementsDisplayComponent } from '../../shared/components/requirements-display.component';
import { RatingComponent } from '../../shared/components/rating.component';
import { TemplateFormComponent } from './template-form.component';
import { extractVariables, interpolate } from '../../core/utils/template-parser';
import type { Prompt, PromptVersion } from '../../core/models/index';

const VEM_BASE = 'https://vem.dev';

@Component({
  selector: 'app-prompt-detail',
  standalone: true,
  imports: [
    RouterLink,
    TagBadgeComponent,
    CopyButtonComponent,
    ConfirmDialogComponent,
    RequirementsDisplayComponent,
    RatingComponent,
    TemplateFormComponent,
  ],
  template: `
    @if (prompt()) {
      <div class="max-w-3xl mx-auto space-y-5">
        <!-- Header -->
        <div>
          <a
            routerLink="/prompts"
            class="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-3 transition-colors"
          >
            <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path
                d="M7.78 2.22a.75.75 0 0 1 0 1.06L5.06 6l2.72 2.72a.75.75 0 1 1-1.06 1.06L3.47 6.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z"
              />
            </svg>
            All prompts
          </a>
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <h1 class="text-2xl font-semibold text-slate-100">{{ prompt()!.title }}</h1>
              @if (prompt()!.description) {
                <p class="text-sm text-slate-400 mt-1">{{ prompt()!.description }}</p>
              }
            </div>
            <div class="flex items-center gap-2 shrink-0 mt-1">
              @if (prompt()!.visibility === 'public') {
                <a
                  [routerLink]="['/discover', prompt()!.id]"
                  class="btn-ghost px-3 py-1.5 text-xs"
                  title="View as it appears in Discover"
                >
                  <svg
                    class="w-3.5 h-3.5"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 2C4.5 2 1.5 4.5 1.5 8s3 6 6.5 6 6.5-2.5 6.5-6-3-6-6.5-6Zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
                    />
                  </svg>
                  Discover
                </a>
              }
              <a
                [routerLink]="['/prompts', prompt()!.id, 'edit']"
                class="btn-ghost px-3 py-1.5 text-xs"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path
                    d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"
                  />
                </svg>
                Edit
              </a>
              <button (click)="showDeleteConfirm.set(true)" class="btn-danger px-3 py-1.5 text-xs">
                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path
                    d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Z"
                  />
                </svg>
                Delete
              </button>
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

          <!-- Visibility badge + share link -->
          <div class="flex items-center gap-3 my-3">
            <span
              class="text-xs px-2 py-0.5 rounded-full font-medium"
              [style]="
                prompt()!.visibility === 'public'
                  ? 'background:rgba(16,185,129,0.1);color:#6ee7b7;border:1px solid rgba(16,185,129,0.2)'
                  : 'background:rgba(255,255,255,0.05);color:#64748b;border:1px solid rgba(255,255,255,0.09)'
              "
            >
              @if (prompt()!.visibility === 'public') {
                <svg
                  class="w-3 h-3 inline shrink-0 mr-1"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM3.69 6.5h1.67c.1-.9.28-1.73.53-2.45a4.52 4.52 0 0 0-2.2 2.45ZM7.25 6.5c.05-.86.2-1.63.43-2.25.14-.38.3-.67.46-.85.15-.18.27-.24.36-.24.09 0 .21.06.36.24.16.18.32.47.46.85.23.62.38 1.39.43 2.25H7.25Zm2.5 0h1.56a4.52 4.52 0 0 0-2.2-2.45c.25.72.43 1.55.53 2.45h.11Zm1.56 1h-1.67c.03.3.05.6.05.9v.6H9.75c-.05.86-.2 1.63-.43 2.25a4.52 4.52 0 0 0 2.2-2.45 4.4 4.4 0 0 0-.22-1.3ZM7.25 9.5c.05.86.2 1.63.43 2.25.14.38.3.67.46.85.15.18.27.24.36.24.09 0 .21-.06.36-.24.16-.18.32-.47.46-.85.23-.62.38-1.39.43-2.25H7.25Zm-2.5 0a4.52 4.52 0 0 0 2.2 2.45c-.25-.72-.43-1.55-.53-2.45H4.75Zm-1.56-1h1.67c-.03-.3-.05-.6-.05-.9v-.6H4.25a4.4 4.4 0 0 0 .22 1.3 4.52 4.52 0 0 0-.22-1.3Z"
                  /></svg
                >Public
              } @else {
                <svg
                  class="w-3 h-3 inline shrink-0 mr-1"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z"
                    clip-rule="evenodd"
                  /></svg
                >Private
              }
            </span>
            @if (prompt()!.visibility === 'public') {
              <app-copy-button [isShare]="true" [text]="shareUrl()" />
            }
          </div>
        </div>

        <!-- vem.dev CTA -->
        <div class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-emerald-400">Run this prompt with vem.dev</p>
            <p class="text-xs text-slate-500 mt-0.5">Executes your prompt as an agent task — public or private.</p>
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

        <!-- Requirements -->
        @if (prompt()?.requirements) {
          <app-requirements-display [req]="prompt()!.requirements!" />
        }

        <!-- Rating (public prompts only) -->
        @if (prompt()?.visibility === 'public') {
          @if (authStore.isAuthenticated()) {
            <div class="flex items-center gap-4">
              <span class="text-xs text-slate-500">Rate:</span>
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
              <a
                routerLink="/auth/login"
                class="text-indigo-400 hover:text-violet-400 transition-colors"
                >Sign in</a
              >
              <span>to rate</span>
              <span class="inline-flex items-center gap-1">
                <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    d="M1 8.25a1.25 1.25 0 1 1 2.5 0v7.5a1.25 1.25 0 0 1-2.5 0v-7.5ZM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0 1 14 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 0 1-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 0 1-1.341-.317l-2.734-1.366A3 3 0 0 0 6.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 0 1 2.166-1.73c.432-.143.853-.386 1.011-.76A2.8 2.8 0 0 0 11 3Z"
                  />
                </svg>
                {{ likes() }}
              </span>
              <span class="inline-flex items-center gap-1">
                <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    d="M18.905 12.75a1.25 1.25 0 0 1-2.5 0v-7.5a1.25 1.25 0 0 1 2.5 0v7.5ZM8.905 17v1.3c0 .268-.14.526-.395.607A2 2 0 0 1 5.905 17c0-.995.182-1.948.514-2.826.204-.54-.166-1.174-.744-1.174h-2.52c-1.243 0-2.261-1.01-2.146-2.247.193-2.08.652-4.082 1.341-5.974C2.752 3.678 3.833 3 5.005 3h3.192a3 3 0 0 1 1.341.317l2.734 1.366A3 3 0 0 0 13.613 5h1.292v7h-.963c-.685 0-1.258.483-1.612 1.068a4.011 4.011 0 0 1-2.166 1.73c-.432.143-.853.386-1.011.76a2.8 2.8 0 0 0-.24 1.142Z"
                  />
                </svg>
                {{ dislikes() }}
              </span>
            </p>
          }
        }

        @if (variables().length > 0) {
          <app-template-form
            [variables]="variables()"
            [values]="variableValues()"
            (valuesChange)="variableValues.set($event)"
          />
        }

        <!-- Content / preview -->
        <div class="glass-card overflow-hidden">
          <div
            class="flex items-center justify-between px-5 py-3"
            style="border-bottom:1px solid rgba(255,255,255,0.06)"
          >
            <span class="section-label">{{ variables().length > 0 ? 'Preview' : 'Content' }}</span>
            <app-copy-button [text]="rendered()" />
          </div>
          <pre
            class="px-5 py-4 whitespace-pre-wrap text-sm text-slate-300 leading-relaxed overflow-x-auto"
            style="font-family:'JetBrains Mono',ui-monospace,monospace"
            >{{ rendered() }}</pre
          >
        </div>

        <!-- Version history -->
        <div class="glass-card overflow-hidden">
          <div class="px-5 py-3" style="border-bottom:1px solid rgba(255,255,255,0.06)">
            <span class="section-label">Version History</span>
          </div>
          <div class="p-5">
            @if (versions().length === 0) {
              <p class="text-sm text-slate-600">No previous versions.</p>
            } @else {
              <div class="space-y-0">
                @for (v of versions(); track v.id) {
                  <div
                    class="flex items-center justify-between py-2.5"
                    style="border-bottom:1px solid rgba(255,255,255,0.04)"
                    [class.border-b-0]="$last"
                  >
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="text-xs font-mono text-slate-600 shrink-0 tabular-nums"
                        >v{{ v.version }}</span
                      >
                      <span class="text-sm text-slate-300 truncate">{{ v.title }}</span>
                      <span class="text-xs text-slate-600 shrink-0">{{
                        formatDate(v.saved_at)
                      }}</span>
                    </div>
                    <button
                      (click)="restoreVersion(v)"
                      class="text-xs text-indigo-400 hover:text-violet-400 font-medium ml-3 shrink-0 transition-colors cursor-pointer"
                    >
                      Restore
                    </button>
                  </div>
                }
              </div>
            }
            @if (restoreConfirmVersion()) {
              <div
                class="mt-4 p-4 rounded-xl"
                style="background:rgba(245,158,11,0.10);border:1px solid rgba(245,158,11,0.20)"
              >
                <p class="text-sm text-amber-300 mb-3">
                  Restore <strong>v{{ restoreConfirmVersion()!.version }}</strong> — "{{
                    restoreConfirmVersion()!.title
                  }}"? The current version will be saved first.
                </p>
                <div class="flex gap-2">
                  <button
                    (click)="confirmRestore()"
                    class="px-3 py-1.5 text-xs font-medium text-white rounded-lg cursor-pointer transition-colors"
                    style="background:rgba(245,158,11,0.8)"
                  >
                    Restore
                  </button>
                  <button
                    (click)="restoreConfirmVersion.set(null)"
                    class="btn-ghost px-3 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    } @else if (loading()) {
      <div class="flex items-center justify-center py-24">
        <svg
          class="w-5 h-5 text-slate-600 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    } @else {
      <div class="text-center py-24 text-slate-500 text-sm">Prompt not found.</div>
    }

    @if (showDeleteConfirm()) {
      <app-confirm-dialog
        title="Delete prompt"
        message="This prompt and all its version history will be permanently deleted."
        confirmLabel="Delete"
        (confirmed)="deletePrompt()"
        (cancelled)="showDeleteConfirm.set(false)"
      />
    }
  `,
})
export class PromptDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly promptStore = inject(PromptStore);
  readonly tagStore = inject(TagStore);
  readonly authStore = inject(AuthStore);
  private readonly versionApi = inject(VersionApiService);
  private readonly promptApi = inject(PromptApiService);

  readonly prompt = signal<Prompt | null>(null);
  readonly loading = signal(true);
  readonly runningVem = signal(false);
  readonly versions = signal<PromptVersion[]>([]);
  readonly variableValues = signal<Partial<Record<string, string>>>({});
  readonly showDeleteConfirm = signal(false);
  readonly restoreConfirmVersion = signal<PromptVersion | null>(null);
  readonly likes = signal(0);
  readonly dislikes = signal(0);

  readonly shareUrl = computed(
    () => `${window.location.origin}/discover/${this.prompt()?.id ?? ''}`,
  );
  readonly variables = computed(() => extractVariables(this.prompt()?.content ?? ''));
  readonly rendered = computed(() =>
    interpolate(this.prompt()?.content ?? '', this.variableValues()),
  );

  ngOnInit(): void {
    this.tagStore.load();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.promptStore.getById(id).subscribe({
      next: (p) => {
        this.prompt.set(p);
        this.likes.set(p.like_count);
        this.dislikes.set(p.dislike_count);
        this.loading.set(false);
        this.loadVersions(id);
      },
      error: () => this.loading.set(false),
    });
  }

  onRatingChange(_event: {
    likes: number;
    dislikes: number;
    userRating: 'like' | 'dislike' | null;
  }): void {
    const id = this.prompt()?.id;
    if (!id) return;
    this.promptStore.getById(id).subscribe((p) => {
      this.likes.set(p.like_count);
      this.dislikes.set(p.dislike_count);
    });
  }

  private loadVersions(promptId: number): void {
    this.versionApi.list(promptId).subscribe((v) => this.versions.set(v));
  }

  restoreVersion(v: PromptVersion): void {
    this.restoreConfirmVersion.set(v);
  }

  confirmRestore(): void {
    const v = this.restoreConfirmVersion();
    if (!v) return;
    this.versionApi.restore(v.prompt_id, v.id).subscribe((updated) => {
      this.prompt.set(updated);
      this.restoreConfirmVersion.set(null);
      this.loadVersions(updated.id);
    });
  }

  deletePrompt(): void {
    const id = this.prompt()?.id;
    if (!id) return;
    this.promptStore.delete(id).subscribe(() => this.router.navigate(['/prompts']));
  }

  runInVem(): void {
    const current = this.prompt();
    if (!current || this.runningVem()) return;
    this.runningVem.set(true);
    this.promptApi.generateRunToken(current.id).subscribe({
      next: ({ token }) => {
        window.open(`${VEM_BASE}/run?prompt_source=noikio&prompt_token=${token}`, '_blank', 'noopener');
        this.runningVem.set(false);
      },
      error: () => this.runningVem.set(false),
    });
  }

  formatDate(unixSecs: number): string {
    return new Date(unixSecs * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
