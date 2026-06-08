import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="glass-card p-5 mt-3">
      <div class="flex items-center gap-2 mb-4">
        <svg
          class="w-3.5 h-3.5 text-indigo-400"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M.5 3.5A.5.5 0 0 1 1 3h14a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5H1a.5.5 0 0 1-.5-.5v-9Zm1 1v8h13v-8H1.5Z"
            clip-rule="evenodd"
          />
          <path d="M3 5.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5Z" />
        </svg>
        <span class="section-label">Variables</span>
      </div>
      <div class="space-y-3">
        @for (variable of variables(); track variable) {
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5">
              <span class="font-mono text-indigo-400" style="font-family:'JetBrains Mono',monospace"
                >{{ '{{' + variable + '}}' }}</span
              >
            </label>
            <input
              type="text"
              [placeholder]="'Enter ' + variable"
              [value]="values()[variable] ?? ''"
              (input)="onInput(variable, $event)"
              class="glass-input px-3 py-2 text-sm"
            />
          </div>
        }
      </div>
    </div>
  `,
})
export class TemplateFormComponent {
  readonly variables = input.required<string[]>();
  readonly values = input.required<Partial<Record<string, string>>>();
  readonly valuesChange = output<Partial<Record<string, string>>>();

  onInput(variable: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.valuesChange.emit({ ...this.values(), [variable]: value });
  }
}
