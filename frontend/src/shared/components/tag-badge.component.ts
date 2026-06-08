import { Component, input } from '@angular/core';
import type { Tag } from '../../core/models/index';

@Component({
  selector: 'app-tag-badge',
  standalone: true,
  template: `
    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium text-slate-300"
      style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09)">
      <span class="w-1.5 h-1.5 rounded-full shrink-0" [style.background-color]="tag().color"></span>
      {{ tag().name }}
    </span>
  `,
})
export class TagBadgeComponent {
  readonly tag = input.required<Tag>();
}
