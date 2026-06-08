import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="fixed inset-0 flex items-center justify-center z-50 p-4"
      style="background:rgba(0,0,0,0.75);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)">
      <div class="glass-card p-6 max-w-sm w-full shadow-2xl"
        style="box-shadow:0 32px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.05)">
        <div class="flex items-start gap-3 mb-5">
          <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.25)">
            <svg class="w-4 h-4 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-slate-100 mb-1">{{ title() }}</h3>
            <p class="text-sm text-slate-400">{{ message() }}</p>
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <button (click)="cancelled.emit()" class="btn-ghost px-4 py-2 text-sm">Cancel</button>
          <button (click)="confirmed.emit()" class="btn-destructive px-4 py-2 text-sm">{{ confirmLabel() }}</button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly title = input('Are you sure?');
  readonly message = input('This action cannot be undone.');
  readonly confirmLabel = input('Delete');
  readonly confirmed = output();
  readonly cancelled = output();
}
