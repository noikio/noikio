import { Component, input, output, signal, computed, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CopyButtonComponent } from '../../shared/components/copy-button.component';
import { extractVariables, interpolate } from '../../core/utils/template-parser';
import type { ChainStep } from '../../core/models/index';

@Component({
  selector: 'app-chain-step-runner',
  standalone: true,
  imports: [FormsModule, CopyButtonComponent],
  template: `
    <div class="space-y-5">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold shrink-0"
          style="background:linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.3));border:1px solid rgba(99,102,241,0.35);color:#a5b4fc">
          {{ stepIndex() + 1 }}
        </span>
        <div>
          <h3 class="text-sm font-semibold text-slate-200">{{ step().prompt.title }}</h3>
          <p class="text-xs text-slate-500">Step {{ stepIndex() + 1 }} of {{ totalSteps() }}</p>
        </div>
      </div>

      @if (variables().length > 0) {
        <div class="glass-card p-4 space-y-3" style="background:rgba(0,0,0,0.25)">
          <p class="section-label">Variables</p>
          @for (v of variables(); track v) {
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5">
                <span class="font-mono text-indigo-400" style="font-family:'JetBrains Mono',monospace">{{ '{{' + v + '}}' }}</span>
              </label>
              <input type="text" [value]="values()[v] ?? ''" (input)="onInput(v, $event)"
                [placeholder]="'Enter ' + v" class="glass-input px-3 py-2 text-sm" />
            </div>
          }
        </div>
      }

      <div class="glass-card overflow-hidden" style="background:rgba(0,0,0,0.25)">
        <div class="flex items-center justify-between px-4 py-2.5" style="border-bottom:1px solid rgba(255,255,255,0.06)">
          <span class="section-label">Preview</span>
          <app-copy-button [text]="rendered()" />
        </div>
        <pre class="px-4 py-3 whitespace-pre-wrap text-sm text-slate-300 leading-relaxed overflow-x-auto"
          style="font-family:'JetBrains Mono',ui-monospace,monospace">{{ rendered() }}</pre>
      </div>

      <div class="flex items-center justify-between pt-1">
        <button (click)="prev.emit()" [disabled]="stepIndex() === 0"
          class="btn-ghost px-4 py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed">
          <svg class="w-3.5 h-3.5" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M7.78 2.22a.75.75 0 0 1 0 1.06L5.06 6l2.72 2.72a.75.75 0 1 1-1.06 1.06L3.47 6.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z"/>
          </svg>
          Previous
        </button>

        @if (stepIndex() < totalSteps() - 1) {
          <button (click)="advanceNext()" class="btn-primary px-4 py-2 text-sm">
            Next
            <svg class="w-3.5 h-3.5" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M4.22 9.78a.75.75 0 0 1 0-1.06L6.94 6 4.22 3.28a.75.75 0 1 1 1.06-1.06l3.25 3.25a.75.75 0 0 1 0 1.06L5.28 9.78a.75.75 0 0 1-1.06 0Z"/>
            </svg>
          </button>
        } @else {
          <button (click)="done.emit()" class="btn-primary px-4 py-2 text-sm"
            style="background:linear-gradient(135deg,#059669,#10b981);box-shadow:0 0 18px rgba(16,185,129,0.4)">
            <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd" />
            </svg>
            Done
          </button>
        }
      </div>
    </div>
  `,
})
export class ChainStepRunnerComponent implements OnChanges {
  readonly step = input.required<ChainStep>();
  readonly stepIndex = input.required<number>();
  readonly totalSteps = input.required<number>();
  readonly seedValues = input<Partial<Record<string, string>>>({});

  readonly prev = output<void>();
  readonly next = output<Partial<Record<string, string>>>();
  readonly done = output<void>();

  readonly values = signal<Partial<Record<string, string>>>({});
  readonly variables = computed(() => extractVariables(this.step().prompt.content));
  readonly rendered = computed(() => interpolate(this.step().prompt.content, this.values()));

  ngOnChanges(): void { this.values.set({ ...this.seedValues() }); }

  onInput(variable: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.values.update((v) => ({ ...v, [variable]: value }));
  }

  advanceNext(): void {
    const forwarded: Partial<Record<string, string>> = {};
    const map = this.step().variable_map;
    const currentValues = this.values();
    for (const [fromVar, toVar] of Object.entries(map)) {
      if (currentValues[fromVar] !== undefined) forwarded[toVar] = currentValues[fromVar];
    }
    this.next.emit(forwarded);
  }
}
