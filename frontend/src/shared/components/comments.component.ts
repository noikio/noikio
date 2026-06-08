import { Component, inject, input, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommentApiService } from '../../core/api/comment-api.service';
import { UserBadgeComponent } from './user-badge.component';
import type { Comment } from '../../core/models/index';

function formatRelative(unixSec: number): string {
  const diff = Math.floor(Date.now() / 1000 - unixSec);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [FormsModule, UserBadgeComponent],
  template: `
    <div class="space-y-5 mt-8">
      <h3 class="section-label">
        Comments
        @if (comments().length > 0) {
          <span class="ml-1.5 text-slate-600 font-normal normal-case tracking-normal text-xs"
            >({{ totalCount() }})</span
          >
        }
      </h3>

      <!-- New comment box -->
      @if (isAuthenticated()) {
        <div class="glass-card p-4 space-y-3">
          <textarea
            [(ngModel)]="newBody"
            placeholder="Add a comment…"
            rows="3"
            class="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none leading-relaxed"
          ></textarea>
          <div class="flex justify-end pt-1" style="border-top:1px solid rgba(255,255,255,0.06)">
            <button
              (click)="submitComment()"
              [disabled]="!newBody.trim() || posting()"
              class="px-4 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style="background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.4);color:#a5b4fc"
            >
              {{ posting() ? 'Posting…' : 'Post' }}
            </button>
          </div>
        </div>
      }

      <!-- Comment list -->
      @if (loading()) {
        <p class="text-sm text-slate-600">Loading comments…</p>
      } @else if (comments().length === 0) {
        <p class="text-sm text-slate-600">No comments yet. Be the first!</p>
      } @else {
        <div class="space-y-3">
          @for (comment of comments(); track comment.id) {
            <div class="glass-card p-4 space-y-3">
              <!-- Header -->
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-slate-300">{{ comment.author }}</span>
                  <app-user-badge [rank]="comment.author_badge" />
                  <span class="text-xs text-slate-600">{{ rel(comment.created_at) }}</span>
                </div>
                @if (comment.author === currentUser()) {
                  <button
                    (click)="deleteComment(comment.id)"
                    class="text-xs text-slate-600 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                }
              </div>

              <!-- Body -->
              <p class="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {{ comment.body }}
              </p>

              <!-- Vote + reply -->
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1">
                  <button
                    (click)="vote(comment, 'up')"
                    [disabled]="!isAuthenticated()"
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all cursor-pointer disabled:cursor-default"
                    [style]="
                      comment.user_vote === 'up'
                        ? 'background:rgba(16,185,129,0.15);color:#6ee7b7;border:1px solid rgba(16,185,129,0.3)'
                        : 'background:rgba(255,255,255,0.04);color:#475569;border:1px solid rgba(255,255,255,0.06)'
                    "
                  >
                    <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                      <path d="M6 1.5 L10.5 7.5 H7.5 V10.5 H4.5 V7.5 H1.5 Z" />
                    </svg>
                    {{ comment.upvotes }}
                  </button>
                  <button
                    (click)="vote(comment, 'down')"
                    [disabled]="!isAuthenticated()"
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all cursor-pointer disabled:cursor-default"
                    [style]="
                      comment.user_vote === 'down'
                        ? 'background:rgba(239,68,68,0.15);color:#fca5a5;border:1px solid rgba(239,68,68,0.3)'
                        : 'background:rgba(255,255,255,0.04);color:#475569;border:1px solid rgba(255,255,255,0.06)'
                    "
                  >
                    <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                      <path d="M6 10.5 L1.5 4.5 H4.5 V1.5 H7.5 V4.5 H10.5 Z" />
                    </svg>
                    {{ comment.downvotes }}
                  </button>
                </div>
                @if (isAuthenticated()) {
                  <button
                    (click)="toggleReply(comment.id)"
                    class="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    Reply
                  </button>
                }
              </div>

              <!-- Reply input -->
              @if (replyingTo() === comment.id) {
                <div class="pl-4 space-y-2" style="border-left:2px solid rgba(99,102,241,0.3)">
                  <textarea
                    [(ngModel)]="replyBody"
                    placeholder="Write a reply…"
                    rows="2"
                    class="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none leading-relaxed"
                  ></textarea>
                  <div class="flex items-center gap-2">
                    <button
                      (click)="submitReply(comment.id)"
                      [disabled]="!replyBody.trim() || posting()"
                      class="px-3 py-1 text-xs font-medium rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      style="background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.4);color:#a5b4fc"
                    >
                      {{ posting() ? 'Posting…' : 'Reply' }}
                    </button>
                    <button
                      (click)="cancelReply()"
                      class="px-3 py-1 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              }

              <!-- Replies -->
              @if (comment.replies.length > 0) {
                <div class="space-y-3 pl-4" style="border-left:2px solid rgba(255,255,255,0.06)">
                  @for (reply of comment.replies; track reply.id) {
                    <div class="space-y-2">
                      <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-semibold text-slate-300">{{
                            reply.author
                          }}</span>
                          <app-user-badge [rank]="reply.author_badge" />
                          <span class="text-xs text-slate-600">{{ rel(reply.created_at) }}</span>
                        </div>
                        @if (reply.author === currentUser()) {
                          <button
                            (click)="deleteComment(reply.id)"
                            class="text-xs text-slate-600 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        }
                      </div>
                      <p class="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {{ reply.body }}
                      </p>
                      <div class="flex items-center gap-1">
                        <button
                          (click)="vote(reply, 'up')"
                          [disabled]="!isAuthenticated()"
                          class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all cursor-pointer disabled:cursor-default"
                          [style]="
                            reply.user_vote === 'up'
                              ? 'background:rgba(16,185,129,0.15);color:#6ee7b7;border:1px solid rgba(16,185,129,0.3)'
                              : 'background:rgba(255,255,255,0.04);color:#475569;border:1px solid rgba(255,255,255,0.06)'
                          "
                        >
                          <svg
                            class="w-3 h-3"
                            viewBox="0 0 12 12"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M6 1.5 L10.5 7.5 H7.5 V10.5 H4.5 V7.5 H1.5 Z" />
                          </svg>
                          {{ reply.upvotes }}
                        </button>
                        <button
                          (click)="vote(reply, 'down')"
                          [disabled]="!isAuthenticated()"
                          class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all cursor-pointer disabled:cursor-default"
                          [style]="
                            reply.user_vote === 'down'
                              ? 'background:rgba(239,68,68,0.15);color:#fca5a5;border:1px solid rgba(239,68,68,0.3)'
                              : 'background:rgba(255,255,255,0.04);color:#475569;border:1px solid rgba(255,255,255,0.06)'
                          "
                        >
                          <svg
                            class="w-3 h-3"
                            viewBox="0 0 12 12"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M6 10.5 L1.5 4.5 H4.5 V1.5 H7.5 V4.5 H10.5 Z" />
                          </svg>
                          {{ reply.downvotes }}
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class CommentsComponent implements OnInit {
  private readonly api = inject(CommentApiService);

  readonly promptId = input.required<number>();
  readonly isAuthenticated = input.required<boolean>();
  readonly currentUser = input<string | null>(null);

  readonly comments = signal<Comment[]>([]);
  readonly loading = signal(true);
  readonly posting = signal(false);
  readonly replyingTo = signal<number | null>(null);

  newBody = '';
  replyBody = '';

  readonly totalCount = () => {
    return this.comments().reduce((sum, c) => sum + 1 + c.replies.length, 0);
  };

  readonly rel = formatRelative;

  ngOnInit(): void {
    this.api.list(this.promptId()).subscribe({
      next: (list) => {
        this.comments.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  submitComment(): void {
    const body = this.newBody.trim();
    if (!body || this.posting()) return;
    this.posting.set(true);
    this.api.create(this.promptId(), body).subscribe({
      next: (comment) => {
        this.comments.update((list) => [...list, { ...comment, replies: [] }]);
        this.newBody = '';
        this.posting.set(false);
      },
      error: () => this.posting.set(false),
    });
  }

  toggleReply(commentId: number): void {
    this.replyingTo.set(this.replyingTo() === commentId ? null : commentId);
    this.replyBody = '';
  }

  cancelReply(): void {
    this.replyingTo.set(null);
    this.replyBody = '';
  }

  submitReply(parentId: number): void {
    const body = this.replyBody.trim();
    if (!body || this.posting()) return;
    this.posting.set(true);
    this.api.create(this.promptId(), body, parentId).subscribe({
      next: (reply) => {
        this.comments.update((list) =>
          list.map((c) => (c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c)),
        );
        this.replyingTo.set(null);
        this.replyBody = '';
        this.posting.set(false);
      },
      error: () => this.posting.set(false),
    });
  }

  vote(item: Comment, dir: 'up' | 'down'): void {
    if (!this.isAuthenticated()) return;
    const pid = this.promptId();
    if (item.user_vote === dir) {
      this.api.removeVote(pid, item.id).subscribe(() => this.updateVote(item.id, null, dir, -1, 0));
    } else {
      const prev = item.user_vote;
      this.api
        .vote(pid, item.id, dir)
        .subscribe(() =>
          this.updateVote(item.id, dir, prev, dir === 'up' ? 1 : 0, dir === 'down' ? 1 : 0),
        );
    }
  }

  private updateVote(
    id: number,
    newVote: 'up' | 'down' | null,
    removedVote: 'up' | 'down' | null,
    upDelta: number,
    downDelta: number,
  ): void {
    // Calculate actual deltas: remove old vote effect, add new
    const upChange = (newVote === 'up' ? 1 : 0) - (removedVote === 'up' ? 1 : 0);
    const downChange = (newVote === 'down' ? 1 : 0) - (removedVote === 'down' ? 1 : 0);

    this.comments.update((list) =>
      list.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            user_vote: newVote,
            upvotes: c.upvotes + upChange,
            downvotes: c.downvotes + downChange,
          };
        }
        return {
          ...c,
          replies: c.replies.map((r) =>
            r.id === id
              ? {
                  ...r,
                  user_vote: newVote,
                  upvotes: r.upvotes + upChange,
                  downvotes: r.downvotes + downChange,
                }
              : r,
          ),
        };
      }),
    );
  }

  deleteComment(id: number): void {
    this.api.delete(this.promptId(), id).subscribe(() => {
      this.comments.update((list) =>
        list
          .filter((c) => c.id !== id)
          .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== id) })),
      );
    });
  }
}
