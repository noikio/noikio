import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SearchStore {
  private readonly _query = signal('');
  readonly query = this._query.asReadonly();

  setQuery(q: string): void {
    this._query.set(q);
  }
}
