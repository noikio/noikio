import { Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NotificationsApiService } from '../../core/api/notifications-api.service';
import type { Notification } from '../../core/models/index';

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_LABELS: Record<string, string> = {
  new_follower: 'followed you',
  prompt_liked: 'liked your prompt',
  comment_reply: 'replied to your comment',
  badge_awarded: 'awarded you a badge',
};

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="relative">
      <button (click)="toggleOpen()" class="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors" aria-label="Notifications">
        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        @if (unreadCount() > 0) {
          <span class="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold bg-indigo-500 text-white rounded-full flex items-center justify-center">
            {{ unreadCount() > 9 ? '9+' : unreadCount() }}
          </span>
        }
      </button>

      @if (open()) {
        <div class="absolute right-0 top-full mt-2 w-80 glass-card shadow-2xl z-50 overflow-hidden"
          style="border-color:rgba(255,255,255,0.1)">
          <div class="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
            <span class="text-xs font-medium text-slate-300">Notifications</span>
            @if (unreadCount() > 0) {
              <button (click)="markAllRead()" class="text-xs text-indigo-400 hover:text-violet-400 transition-colors">
                Mark all read
              </button>
            }
          </div>

          <div class="max-h-80 overflow-y-auto">
            @if (notifications().length === 0) {
              <p class="text-xs text-slate-600 text-center py-6">No notifications yet.</p>
            } @else {
              @for (n of notifications(); track n.id) {
                <button
                  (click)="navigate(n)"
                  class="w-full text-left px-4 py-3 hover:bg-white/3 transition-colors border-b border-white/3 last:border-0"
                  [class.bg-indigo-500/5]="!n.read">
                  <div class="flex items-start gap-2">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                      style="background:linear-gradient(135deg,#6366f1,#8b5cf6)">
                      {{ (n.actor_username ?? '?')[0].toUpperCase() }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs text-slate-300 leading-relaxed">
                        <span class="font-medium">{{ n.actor_username ?? 'Someone' }}</span>
                        {{ typeLabel(n.type) }}
                      </p>
                      <span class="text-[10px] text-slate-600">{{ timeAgo(n.created_at) }}</span>
                    </div>
                    @if (!n.read) {
                      <div class="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5"></div>
                    }
                  </div>
                </button>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class NotificationBellComponent implements OnInit {
  private readonly api = inject(NotificationsApiService);
  private readonly router = inject(Router);

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal(0);
  readonly open = signal(false);

  readonly timeAgo = timeAgo;

  ngOnInit(): void {
    this.refresh();
    // Poll every 60s for new notifications
    setInterval(() => this.refresh(), 60_000);
  }

  refresh(): void {
    this.api.getAll().subscribe({
      next: (res) => {
        this.notifications.set(res.notifications);
        this.unreadCount.set(res.unread_count);
      },
    });
  }

  toggleOpen(): void {
    this.open.update(v => !v);
  }

  markAllRead(): void {
    this.api.markAllRead().subscribe(() => {
      this.unreadCount.set(0);
      this.notifications.update(list => list.map(n => ({ ...n, read: 1 })));
    });
  }

  navigate(n: Notification): void {
    if (!n.read) {
      this.api.markRead(n.id).subscribe();
      this.notifications.update(list => list.map(item => item.id === n.id ? { ...item, read: 1 } : item));
      this.unreadCount.update(c => Math.max(0, c - 1));
    }
    this.open.set(false);

    if (n.entity_type === 'prompt' && n.entity_id) {
      this.router.navigate(['/discover', n.entity_id]);
    } else if (n.entity_type === 'user' && n.actor_username) {
      this.router.navigate(['/users', n.actor_username]);
    } else if (n.entity_type === 'comment' && n.entity_id) {
      this.router.navigate(['/discover']);
    }
  }

  typeLabel(type: string): string {
    return TYPE_LABELS[type] ?? type;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-notification-bell')) {
      this.open.set(false);
    }
  }
}
