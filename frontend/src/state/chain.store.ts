import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ChainApiService, type CreateChainDto, type UpdateChainDto } from '../core/api/chain-api.service';
import type { Chain } from '../core/models/index';

@Injectable({ providedIn: 'root' })
export class ChainStore {
  private readonly api = inject(ChainApiService);

  private readonly _chains = signal<Chain[]>([]);
  private readonly _loading = signal(false);

  readonly chains = this._chains.asReadonly();
  readonly loading = this._loading.asReadonly();

  load(): void {
    this._loading.set(true);
    this.api.list().subscribe({
      next: (chains) => {
        this._chains.set(chains);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  getById(id: number): Observable<Chain> {
    return this.api.getById(id);
  }

  create(dto: CreateChainDto): Observable<Chain> {
    return this.api.create(dto);
  }

  update(id: number, dto: UpdateChainDto): Observable<Chain> {
    return this.api.update(id, dto);
  }

  delete(id: number): Observable<{ ok: boolean }> {
    return this.api.delete(id).pipe(
      tap(() => this._chains.update((cs) => cs.filter((c) => c.id !== id)))
    );
  }
}
