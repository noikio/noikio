import { inject, Injectable, signal } from '@angular/core';
import { PromptApiService, type CreatePromptDto, type UpdatePromptDto } from '../core/api/prompt-api.service';
import type { Prompt } from '../core/models/index';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PromptStore {
  private readonly api = inject(PromptApiService);

  private readonly _prompts = signal<Prompt[]>([]);
  private readonly _loading = signal(false);

  readonly prompts = this._prompts.asReadonly();
  readonly loading = this._loading.asReadonly();

  load(q?: string, tag?: number): void {
    this._loading.set(true);
    this.api.list(q, tag ? [tag] : undefined).subscribe({
      next: (prompts) => {
        this._prompts.set(prompts);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  getById(id: number): Observable<Prompt> {
    return this.api.getById(id);
  }

  create(dto: CreatePromptDto): Observable<Prompt> {
    return this.api.create(dto);
  }

  update(id: number, dto: UpdatePromptDto): Observable<Prompt> {
    return this.api.update(id, dto);
  }

  delete(id: number): Observable<{ ok: boolean }> {
    return this.api.delete(id).pipe(
      tap(() => this._prompts.update((ps) => ps.filter((p) => p.id !== id)))
    );
  }
}
