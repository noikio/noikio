import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Chain } from '../models/index';

export interface ChainStepDto {
  promptId: number;
  stepOrder: number;
  variableMap?: Partial<Record<string, string>>;
}

export interface CreateChainDto {
  name: string;
  description?: string;
  steps?: ChainStepDto[];
}

export interface UpdateChainDto {
  name?: string;
  description?: string;
  steps?: ChainStepDto[];
}

@Injectable({ providedIn: 'root' })
export class ChainApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/chains';

  list(): Observable<Chain[]> {
    return this.http.get<Chain[]>(this.base);
  }

  getById(id: number): Observable<Chain> {
    return this.http.get<Chain>(`${this.base}/${id}`);
  }

  create(dto: CreateChainDto): Observable<Chain> {
    return this.http.post<Chain>(this.base, dto);
  }

  update(id: number, dto: UpdateChainDto): Observable<Chain> {
    return this.http.put<Chain>(`${this.base}/${id}`, dto);
  }

  delete(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`);
  }
}
