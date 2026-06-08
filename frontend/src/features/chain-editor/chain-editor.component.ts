import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChainStore } from '../../state/chain.store';
import { PromptStore } from '../../state/prompt.store';
import { ChainStepEditorComponent, type StepDraft } from './chain-step-editor.component';
import type { Chain } from '../../core/models/index';

@Component({
  selector: 'app-chain-editor',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ChainStepEditorComponent],
  template: `
    <div class="max-w-2xl mx-auto">
      <div class="mb-7">
        <a routerLink="/chains" class="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-3 transition-colors">
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M7.78 2.22a.75.75 0 0 1 0 1.06L5.06 6l2.72 2.72a.75.75 0 1 1-1.06 1.06L3.47 6.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z"/>
          </svg>
          All chains
        </a>
        <h1 class="text-2xl font-semibold text-slate-100">{{ isEdit() ? 'Edit Chain' : 'New Chain' }}</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Name <span class="text-red-400">*</span></label>
          <input formControlName="name" type="text" autocomplete="off"
            class="glass-input px-3 py-2.5 text-sm"
            [style]="nameInvalid() ? 'border-color:rgba(239,68,68,0.5)' : ''" />
          @if (nameInvalid()) { <p class="text-xs text-red-400 mt-1.5">Name is required.</p> }
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
          <input formControlName="description" type="text" autocomplete="off" class="glass-input px-3 py-2.5 text-sm" />
        </div>

        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="text-xs font-medium text-slate-400">Steps</label>
            <button type="button" (click)="addStep()" class="text-xs text-indigo-400 hover:text-violet-400 font-medium transition-colors cursor-pointer">+ Add step</button>
          </div>
          @if (steps().length === 0) {
            <div class="text-center py-8 rounded-xl" style="border:1px dashed rgba(255,255,255,0.09)">
              <p class="text-sm text-slate-600">No steps yet.</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (step of steps(); track $index; let i = $index) {
                <app-chain-step-editor [step]="step" [index]="i" [isLast]="i === steps().length - 1"
                  [prompts]="availablePrompts()" (stepChange)="updateStep(i, $event)"
                  (moveUp)="moveStep(i, -1)" (moveDown)="moveStep(i, 1)" (remove)="removeStep(i)" />
              }
            </div>
          }
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button type="submit" [disabled]="saving()" class="btn-primary px-5 py-2.5 text-sm">
            {{ saving() ? 'Saving…' : (isEdit() ? 'Save Changes' : 'Create Chain') }}
          </button>
          <a [routerLink]="isEdit() ? ['/chains', chainId()] : '/chains'"
            class="text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors cursor-pointer px-2">
            Cancel
          </a>
        </div>
      </form>
    </div>
  `,
})
export class ChainEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly chainStore = inject(ChainStore);
  private readonly promptStore = inject(PromptStore);

  readonly isEdit = signal(false);
  readonly saving = signal(false);
  readonly nameInvalid = signal(false);
  readonly steps = signal<StepDraft[]>([]);
  readonly chainId = signal<number | null>(null);
  readonly availablePrompts = this.promptStore.prompts;

  readonly form = this.fb.group({ name: ['', Validators.required], description: [''] });

  ngOnInit(): void {
    this.promptStore.load();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true); this.chainId.set(Number(id));
      this.chainStore.getById(Number(id)).subscribe((chain: Chain) => {
        this.form.patchValue({ name: chain.name, description: chain.description });
        this.steps.set((chain.steps ?? []).map((s) => ({ promptId: s.prompt_id, variableMap: s.variable_map })));
      });
    }
  }

  addStep(): void { this.steps.update((s) => [...s, { promptId: null, variableMap: {} }]); }
  updateStep(i: number, d: StepDraft): void { this.steps.update((s) => s.map((step, j) => j === i ? d : step)); }
  moveStep(i: number, dir: -1|1): void {
    this.steps.update((s) => { const n = [...s]; const t = i + dir; if (t < 0 || t >= n.length) return s; [n[i],n[t]] = [n[t],n[i]]; return n; });
  }
  removeStep(i: number): void { this.steps.update((s) => s.filter((_,j) => j !== i)); }

  submit(): void {
    this.nameInvalid.set(false);
    if (this.form.invalid) { this.nameInvalid.set(!!this.form.controls.name.errors); return; }
    const dto = { name: this.form.value.name!, description: this.form.value.description ?? '',
      steps: this.steps().filter(s => s.promptId !== null).map((s,i) => ({ promptId: s.promptId!, stepOrder: i, variableMap: s.variableMap })) };
    this.saving.set(true);
    const id = this.chainId();
    (id ? this.chainStore.update(id, dto) : this.chainStore.create(dto)).subscribe({
      next: (c) => this.router.navigate(['/chains', c.id]),
      error: () => this.saving.set(false),
    });
  }
}
