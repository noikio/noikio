import { Component, input, computed } from '@angular/core';

const BADGE_CONFIG = {
  1: { label: 'Gold', color: '#fbbf24', shadow: 'rgba(251,191,36,0.4)', title: 'Top contributor last month' },
  2: { label: 'Silver', color: '#94a3b8', shadow: 'rgba(148,163,184,0.4)', title: '2nd place last month' },
  3: { label: 'Bronze', color: '#b45309', shadow: 'rgba(180,83,9,0.4)', title: '3rd place last month' },
} as const;

@Component({
  selector: 'app-user-badge',
  standalone: true,
  template: `
    @if (cfg(); as c) {
      <span
        class="inline-flex items-center"
        [title]="c.title"
        [style]="'color:' + c.color + ';filter:drop-shadow(0 0 4px ' + c.shadow + ')'"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd"/>
        </svg>
      </span>
    }
  `,
})
export class UserBadgeComponent {
  readonly rank = input<1 | 2 | 3 | null>(null);
  readonly cfg = computed(() => {
    const r = this.rank();
    return r ? BADGE_CONFIG[r] : null;
  });
}
