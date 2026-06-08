import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChainStore } from '../../state/chain.store';

@Component({
  selector: 'app-chain-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-7">
        <div>
          <h1 class="text-xl font-semibold text-slate-100">Chains</h1>
          <p class="text-xs text-slate-500 mt-0.5">Multi-step prompt workflows</p>
        </div>
        <a routerLink="/chains/new" class="btn-primary px-4 py-2">
          <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
          </svg>
          New Chain
        </a>
      </div>

      @if (store.loading()) {
        <div class="space-y-2">
          @for (i of [1,2,3]; track i) {
            <div class="glass-card p-5 animate-pulse">
              <div class="h-3.5 rounded-md w-1/3 mb-2" style="background:rgba(255,255,255,0.07)"></div>
              <div class="h-3 rounded-md w-1/2" style="background:rgba(255,255,255,0.04)"></div>
            </div>
          }
        </div>
      } @else if (store.chains().length === 0) {
        <div class="text-center py-24">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 glass-card">
            <svg class="w-7 h-7 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
          </div>
          <p class="text-slate-400 text-sm mb-1">No chains yet.</p>
          <p class="text-slate-600 text-xs mb-5">Chains let you walk through multiple prompts in sequence.</p>
          <a routerLink="/chains/new" class="btn-primary px-4 py-2 text-sm">Create your first chain</a>
        </div>
      } @else {
        <div class="space-y-2">
          @for (chain of store.chains(); track chain.id) {
            <a [routerLink]="['/chains', chain.id]" class="glass-card glass-card-hover group block cursor-pointer px-5 py-4">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <h2 class="text-sm font-semibold text-slate-200 group-hover:text-white truncate transition-colors duration-200">{{ chain.name }}</h2>
                  @if (chain.description) {
                    <p class="text-xs text-slate-500 mt-0.5 line-clamp-1">{{ chain.description }}</p>
                  }
                </div>
                <span class="text-xs text-slate-500 font-mono shrink-0 mt-0.5 px-2 py-1 rounded-md tabular-nums"
                  style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.07)">
                  {{ chain.step_count ?? 0 }} {{ (chain.step_count ?? 0) === 1 ? 'step' : 'steps' }}
                </span>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class ChainListComponent implements OnInit {
  readonly store = inject(ChainStore);
  ngOnInit(): void { this.store.load(); }
}
