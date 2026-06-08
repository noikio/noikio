import { Component, input } from '@angular/core';
import type { PromptRequirements } from '../../core/models/index';

@Component({
  selector: 'app-requirements-display',
  standalone: true,
  template: `
    @if (hasAny()) {
      <div class="glass-card p-4 space-y-3 mt-3">
        <span class="section-label">Requirements</span>
        @if (req().skills.length > 0) {
          <div class="flex flex-wrap gap-1.5 mt-2">
            <span class="text-xs text-slate-500 mr-1 self-center">Skills</span>
            @for (s of req().skills; track s) {
              <span
                class="px-2 py-0.5 text-xs rounded-full font-medium"
                style="background:rgba(99,102,241,0.15);color:#a5b4fc;border:1px solid rgba(99,102,241,0.3)"
                >{{ s }}</span
              >
            }
          </div>
        }
        @if (req().mcpServers.length > 0) {
          <div class="flex flex-wrap gap-1.5">
            <span class="text-xs text-slate-500 mr-1 self-center">MCP</span>
            @for (m of req().mcpServers; track m) {
              <span
                class="px-2 py-0.5 text-xs rounded-full font-medium"
                style="background:rgba(16,185,129,0.15);color:#6ee7b7;border:1px solid rgba(16,185,129,0.3)"
                >{{ m }}</span
              >
            }
          </div>
        }
        @if (req().platforms.length > 0) {
          <div class="flex flex-wrap gap-1.5">
            <span class="text-xs text-slate-500 mr-1 self-center">Works in</span>
            @for (p of req().platforms; track p) {
              <span
                class="px-2 py-0.5 text-xs rounded-full font-medium"
                style="background:rgba(245,158,11,0.15);color:#fcd34d;border:1px solid rgba(245,158,11,0.3)"
                >{{ p }}</span
              >
            }
          </div>
        }
      </div>
    }
  `,
})
export class RequirementsDisplayComponent {
  readonly req = input.required<PromptRequirements>();

  hasAny(): boolean {
    const r = this.req();
    return r.skills.length > 0 || r.mcpServers.length > 0 || r.platforms.length > 0;
  }
}
