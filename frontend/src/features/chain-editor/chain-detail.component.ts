import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChainStore } from '../../state/chain.store';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { ChainStepRunnerComponent } from './chain-step-runner.component';
import type { Chain } from '../../core/models/index';

@Component({
  selector: 'app-chain-detail',
  standalone: true,
  imports: [RouterLink, ConfirmDialogComponent, ChainStepRunnerComponent],
  template: `
    @if (chain()) {
      <div class="max-w-3xl mx-auto space-y-5">
        <div>
          <a routerLink="/chains" class="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-3 transition-colors">
            <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M7.78 2.22a.75.75 0 0 1 0 1.06L5.06 6l2.72 2.72a.75.75 0 1 1-1.06 1.06L3.47 6.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z"/>
            </svg>
            All chains
          </a>
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <h1 class="text-2xl font-semibold text-slate-100">{{ chain()!.name }}</h1>
              @if (chain()!.description) {
                <p class="text-sm text-slate-400 mt-1">{{ chain()!.description }}</p>
              }
            </div>
            @if (!running()) {
              <div class="flex items-center gap-2 shrink-0 mt-1">
                <a [routerLink]="['/chains', chain()!.id, 'edit']" class="btn-ghost px-3 py-1.5 text-xs">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"/>
                  </svg>
                  Edit
                </a>
                <button (click)="showDeleteConfirm.set(true)" class="btn-danger px-3 py-1.5 text-xs">Delete</button>
              </div>
            }
          </div>
        </div>

        @if (!running()) {
          <div class="glass-card overflow-hidden">
            <div class="flex items-center justify-between px-5 py-3" style="border-bottom:1px solid rgba(255,255,255,0.06)">
              <span class="section-label">Steps</span>
              @if (steps().length > 0) {
                <button (click)="startRun()" class="btn-primary px-3 py-1.5 text-xs">
                  <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                    <path d="M3 2.69a.75.75 0 0 1 1.088-.67l6.5 3.81a.75.75 0 0 1 0 1.34l-6.5 3.81A.75.75 0 0 1 3 10.31V2.69Z"/>
                  </svg>
                  Run chain
                </button>
              }
            </div>
            <div class="p-5">
              @if (steps().length === 0) {
                <p class="text-sm text-slate-600">No steps yet. <a [routerLink]="['/chains', chain()!.id, 'edit']" class="text-indigo-400 hover:text-violet-400 transition-colors">Add some.</a></p>
              } @else {
                <ol class="space-y-0">
                  @for (step of steps(); track step.id; let i = $index) {
                    <li class="flex items-center gap-3 py-2.5" style="border-bottom:1px solid rgba(255,255,255,0.04)" [class.!border-b-0]="$last">
                      <span class="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold shrink-0"
                        style="background:linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.25));border:1px solid rgba(99,102,241,0.3);color:#a5b4fc">
                        {{ i + 1 }}
                      </span>
                      <span class="text-sm text-slate-300">{{ step.prompt.title }}</span>
                    </li>
                  }
                </ol>
              }
            </div>
          </div>
        }

        @if (running() && steps().length > 0) {
          <div class="glass-card overflow-hidden">
            <div class="flex items-center justify-between px-5 py-3" style="border-bottom:1px solid rgba(255,255,255,0.06)">
              <span class="section-label">Running chain</span>
              <button (click)="stopRun()" class="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">Stop</button>
            </div>
            <div class="p-5">
              @if (!runComplete()) {
                <app-chain-step-runner
                  [step]="steps()[currentStep()]"
                  [stepIndex]="currentStep()"
                  [totalSteps]="steps().length"
                  [seedValues]="seedValues()"
                  (prev)="goToPrev()"
                  (next)="goToNext($event)"
                  (done)="finishRun()"
                />
              } @else {
                <div class="text-center py-12">
                  <div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.25)">
                    <svg class="w-7 h-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p class="text-base font-semibold text-slate-200 mb-1">Chain complete</p>
                  <p class="text-sm text-slate-500 mb-5">All {{ steps().length }} steps finished.</p>
                  <button (click)="startRun()" class="btn-ghost px-4 py-2 text-sm">Run again</button>
                </div>
              }
            </div>
          </div>
        }
      </div>
    } @else if (loading()) {
      <div class="flex items-center justify-center py-24">
        <svg class="w-5 h-5 text-slate-600 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    } @else {
      <div class="text-center py-24 text-slate-500 text-sm">Chain not found.</div>
    }

    @if (showDeleteConfirm()) {
      <app-confirm-dialog title="Delete chain" message="This chain and all its steps will be permanently deleted."
        confirmLabel="Delete" (confirmed)="deleteChain()" (cancelled)="showDeleteConfirm.set(false)" />
    }
  `,
})
export class ChainDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(ChainStore);

  readonly chain = signal<Chain | null>(null);
  readonly loading = signal(true);
  readonly showDeleteConfirm = signal(false);
  readonly running = signal(false);
  readonly currentStep = signal(0);
  readonly runComplete = signal(false);
  readonly seedValues = signal<Partial<Record<string, string>>>({});
  readonly steps = computed(() => this.chain()?.steps ?? []);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.store.getById(id).subscribe({ next: (c) => { this.chain.set(c); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  startRun(): void { this.currentStep.set(0); this.seedValues.set({}); this.runComplete.set(false); this.running.set(true); }
  stopRun(): void { this.running.set(false); this.runComplete.set(false); }
  goToPrev(): void { this.currentStep.update((n) => Math.max(0, n - 1)); }
  goToNext(forwarded: Partial<Record<string, string>>): void { this.seedValues.set(forwarded); this.currentStep.update((n) => n + 1); }
  finishRun(): void { this.runComplete.set(true); }
  deleteChain(): void {
    const id = this.chain()?.id;
    if (!id) return;
    this.store.delete(id).subscribe(() => this.router.navigate(['/chains']));
  }
}
