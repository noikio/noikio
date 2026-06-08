import { Component, input, output, signal, computed, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Prompt } from '../../core/models/index';

export interface StepDraft {
  promptId: number | null;
  variableMap: Partial<Record<string, string>>;
}

@Component({
  selector: 'app-chain-step-editor',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="glass-card flex items-start gap-3 p-4">
      <span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0 mt-0.5"
        style="background:linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.25));border:1px solid rgba(99,102,241,0.3);color:#a5b4fc">
        {{ index() + 1 }}
      </span>

      <div class="flex-1 space-y-3">
        <select [ngModel]="step().promptId" (ngModelChange)="onPromptChange($event)" name="prompt-{{ index() }}"
          class="glass-input px-3 py-2 text-sm cursor-pointer">
          <option [ngValue]="null" style="background:#0a0a12">Select a prompt…</option>
          @for (p of prompts(); track p.id) {
            <option [ngValue]="p.id" style="background:#0a0a12">{{ p.title }}</option>
          }
        </select>

        @if (selectedPrompt() && promptVarNames().length > 0) {
          <div class="space-y-2">
            <p class="text-xs text-slate-500">Forward values to next step's variables (optional):</p>
            @for (fromVar of promptVarNames(); track fromVar) {
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono px-2 py-1 rounded shrink-0"
                  style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.2);color:#a5b4fc;font-family:'JetBrains Mono',monospace">
                  {{ '{{' + fromVar + '}}' }}
                </span>
                <span class="text-xs text-slate-600">→</span>
                <input type="text" [value]="step().variableMap[fromVar] ?? ''" (input)="onMapInput(fromVar, $event)"
                  placeholder="next variable name"
                  class="glass-input flex-1 px-2 py-1.5 text-xs" />
              </div>
            }
          </div>
        }
      </div>

      <div class="flex flex-col gap-0.5 shrink-0">
        <button type="button" (click)="moveUp.emit()" [disabled]="index() === 0"
          class="p-1.5 rounded transition-colors cursor-pointer text-slate-500 hover:text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed"
          title="Move up">
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M6 2.5a.5.5 0 0 1 .354.146l3.5 3.5a.5.5 0 1 1-.708.708L6 3.707 2.854 6.854a.5.5 0 1 1-.708-.708l3.5-3.5A.5.5 0 0 1 6 2.5Z"/>
          </svg>
        </button>
        <button type="button" (click)="moveDown.emit()" [disabled]="isLast()"
          class="p-1.5 rounded transition-colors cursor-pointer text-slate-500 hover:text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed"
          title="Move down">
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M6 9.5a.5.5 0 0 1-.354-.146l-3.5-3.5a.5.5 0 0 1 .708-.708L6 8.293l3.146-3.147a.5.5 0 0 1 .708.708l-3.5 3.5A.5.5 0 0 1 6 9.5Z"/>
          </svg>
        </button>
        <button type="button" (click)="remove.emit()"
          class="p-1.5 rounded transition-colors cursor-pointer text-slate-600 hover:text-red-400"
          title="Remove step">
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M9.854 2.146a.5.5 0 0 1 0 .708L6.707 6l3.147 3.146a.5.5 0 0 1-.708.708L6 6.707 2.854 9.854a.5.5 0 0 1-.708-.708L5.293 6 2.146 2.854a.5.5 0 0 1 .708-.708L6 5.293l3.146-3.147a.5.5 0 0 1 .708 0Z"/>
          </svg>
        </button>
      </div>
    </div>
  `,
})
export class ChainStepEditorComponent implements OnChanges {
  readonly step = input.required<StepDraft>();
  readonly index = input.required<number>();
  readonly isLast = input.required<boolean>();
  readonly prompts = input.required<Prompt[]>();

  readonly stepChange = output<StepDraft>();
  readonly moveUp = output<void>();
  readonly moveDown = output<void>();
  readonly remove = output<void>();

  readonly selectedPrompt = signal<Prompt | null>(null);
  readonly promptVarNames = computed(() => {
    const content = this.selectedPrompt()?.content ?? '';
    const matches = [...content.matchAll(/\{\{\s*(\w+)\s*\}\}/g)];
    return [...new Set(matches.map((m) => m[1]))];
  });

  ngOnChanges(): void {
    const id = this.step().promptId;
    this.selectedPrompt.set(this.prompts().find((p) => p.id === id) ?? null);
  }

  onPromptChange(id: number | null): void {
    this.selectedPrompt.set(this.prompts().find((p) => p.id === id) ?? null);
    this.stepChange.emit({ ...this.step(), promptId: id, variableMap: {} });
  }

  onMapInput(fromVar: string, event: Event): void {
    const toVar = (event.target as HTMLInputElement).value.trim();
    const map = { ...this.step().variableMap };
    if (toVar) map[fromVar] = toVar; else delete map[fromVar];
    this.stepChange.emit({ ...this.step(), variableMap: map });
  }
}
