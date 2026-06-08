import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserApiService } from '../../core/api/user-api.service';
import { FollowsApiService } from '../../core/api/follows-api.service';
import { AuthStore } from '../../state/auth.store';
import { UserBadgeComponent } from '../../shared/components/user-badge.component';
import { TagBadgeComponent } from '../../shared/components/tag-badge.component';
import { TagStore } from '../../state/tag.store';
import type { UserProfile, Badge } from '../../core/models/index';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const RANK_LABELS = { 1: 'Gold', 2: 'Silver', 3: 'Bronze' } as const;

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [RouterLink, UserBadgeComponent, TagBadgeComponent],
  template: `
    @if (loading()) {
      <div class="space-y-4">
        <div class="h-8 bg-white/5 rounded w-48 animate-pulse"></div>
        <div class="h-4 bg-white/5 rounded w-32 animate-pulse"></div>
      </div>
    } @else if (notFound()) {
      <div class="text-center py-16 text-slate-500 text-sm">User not found.</div>
    } @else if (profile(); as p) {
      <div class="space-y-8">
        <!-- Header -->
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
            style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);box-shadow:0 0 20px rgba(99,102,241,0.35)">
            {{ p.username[0].toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-xl font-semibold text-slate-100">{{ p.username }}</h1>
              @if (p.active_badge) {
                <app-user-badge [rank]="p.active_badge" />
                <span class="text-xs text-slate-500">active this month</span>
              }
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Member since {{ memberSince(p.created_at) }}</p>
            <!-- Follower counts -->
            <div class="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span><span class="text-slate-300 font-semibold">{{ followerCount() }}</span> followers</span>
              <span><span class="text-slate-300 font-semibold">{{ followingCount() }}</span> following</span>
            </div>
          </div>
          <!-- Follow button -->
          @if (authStore.isAuthenticated() && authStore.currentUser()?.username !== p.username) {
            <button
              (click)="toggleFollow(p.username)"
              [disabled]="followLoading()"
              class="px-4 py-1.5 text-xs font-medium rounded-lg border transition-all"
              [class]="isFollowing()
                ? 'border-slate-600 text-slate-400 hover:border-red-500/50 hover:text-red-400'
                : 'border-indigo-500 text-indigo-400 hover:bg-indigo-500/10'"
            >
              {{ isFollowing() ? 'Unfollow' : 'Follow' }}
            </button>
          } @else if (!authStore.isAuthenticated()) {
            <a routerLink="/auth/login"
              class="px-4 py-1.5 text-xs font-medium rounded-lg border border-indigo-500 text-indigo-400 hover:bg-indigo-500/10 transition-all">
              Follow
            </a>
          }
        </div>

        <!-- Badge history -->
        @if (p.badges.length > 0) {
          <div class="space-y-3">
            <h2 class="section-label">Badge History</h2>
            <div class="flex flex-wrap gap-2">
              @for (b of p.badges; track b.id) {
                <div class="glass-card px-3 py-2 flex items-center gap-2"
                  [title]="rankLabel(b.rank) + ' — ' + MONTH_NAMES[b.month - 1] + ' ' + b.year">
                  <app-user-badge [rank]="b.rank" />
                  <span class="text-xs text-slate-400 font-medium">{{ rankLabel(b.rank) }}</span>
                  <span class="text-xs text-slate-600">{{ MONTH_NAMES[b.month - 1] }} {{ b.year }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Public prompts -->
        <div class="space-y-3">
          <h2 class="section-label">
            Public Prompts
            @if (p.public_prompts.length > 0) {
              <span class="ml-1.5 text-slate-600 font-normal normal-case tracking-normal text-xs">({{ p.public_prompts.length }})</span>
            }
          </h2>

          @if (p.public_prompts.length === 0) {
            <p class="text-sm text-slate-600">No public prompts yet.</p>
          } @else {
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              @for (prompt of p.public_prompts; track prompt.id) {
                <a [routerLink]="['/discover', prompt.id]"
                  class="glass-card p-4 block hover:border-indigo-500/30 transition-colors group">
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">{{ prompt.title }}</h3>
                    <div class="flex items-center gap-3 shrink-0 text-xs text-slate-500">
                      <span class="flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M1 8.25a1.25 1.25 0 1 1 2.5 0v7.5a1.25 1.25 0 0 1-2.5 0v-7.5ZM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0 1 14 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 0 1-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 0 1-1.341-.317l-2.734-1.366A3 3 0 0 0 6.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 0 1 2.166-1.73c.432-.143.853-.386 1.011-.76A2.8 2.8 0 0 0 11 3Z"/></svg>
                        {{ prompt.like_count }}
                      </span>
                      <span class="flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M18.905 12.75a1.25 1.25 0 0 1-2.5 0v-7.5a1.25 1.25 0 0 1 2.5 0v7.5ZM8.905 17v1.3c0 .268-.14.526-.395.607A2 2 0 0 1 5.905 17c0-.995.182-1.948.514-2.826.204-.54-.166-1.174-.744-1.174h-2.52c-1.243 0-2.261-1.01-2.146-2.247.193-2.08.652-4.082 1.341-5.974C2.752 3.678 3.833 3 5.005 3h3.192a3 3 0 0 1 1.341.317l2.734 1.366A3 3 0 0 0 13.613 5h1.292v7h-.963c-.685 0-1.258.483-1.612 1.068a4.011 4.011 0 0 1-2.166 1.73c-.432.143-.853.386-1.011.76a2.8 2.8 0 0 0-.24 1.142Z"/></svg>
                        {{ prompt.dislike_count }}
                      </span>
                    </div>
                  </div>
                  @if (prompt.description) {
                    <p class="text-xs text-slate-500 mt-1 line-clamp-2">{{ prompt.description }}</p>
                  }
                  @if (prompt.tag_ids.length > 0) {
                    <div class="flex flex-wrap gap-1 mt-3">
                      @for (tagId of prompt.tag_ids; track tagId) {
                        @if (tagStore.tagMap().get(tagId); as tag) {
                          <app-tag-badge [tag]="tag" />
                        }
                      }
                    </div>
                  }
                </a>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class UserProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(UserApiService);
  private readonly followsApi = inject(FollowsApiService);
  readonly authStore = inject(AuthStore);
  readonly tagStore = inject(TagStore);

  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly followLoading = signal(false);
  readonly isFollowing = signal(false);
  readonly followerCount = signal(0);
  readonly followingCount = signal(0);

  readonly MONTH_NAMES = MONTH_NAMES;

  ngOnInit(): void {
    this.tagStore.load();
    const username = this.route.snapshot.paramMap.get('username') ?? '';
    this.api.getProfile(username).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.isFollowing.set(p.is_following);
        this.followerCount.set(p.follower_count ?? 0);
        this.followingCount.set(p.following_count ?? 0);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        if (e.status === 404) this.notFound.set(true);
      },
    });
  }

  toggleFollow(username: string): void {
    if (this.followLoading()) return;
    this.followLoading.set(true);
    const action = this.isFollowing()
      ? this.followsApi.unfollow(username)
      : this.followsApi.follow(username);

    action.subscribe({
      next: (res) => {
        this.isFollowing.set(res.following);
        this.followerCount.update(n => res.following ? n + 1 : Math.max(0, n - 1));
        this.followLoading.set(false);
      },
      error: () => this.followLoading.set(false),
    });
  }

  memberSince(ts: number): string {
    const d = new Date(ts * 1000);
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  }

  rankLabel(rank: 1 | 2 | 3): string {
    return RANK_LABELS[rank];
  }
}
