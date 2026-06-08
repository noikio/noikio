import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Tag } from '../models/index';

export interface CreateTagDto {
  name: string;
  color?: string;
}

export interface UpdateTagDto {
  name?: string;
  color?: string;
}

@Injectable({ providedIn: 'root' })
export class TagApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/prompts/tags';

  list(): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.base);
  }

  listDefaults(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.base}/defaults`);
  }

  suggest(q?: string, limit = 20): Observable<Tag[]> {
    const params: Record<string, string> = { limit: String(limit) };
    if (q?.trim()) params['q'] = q.trim();
    return this.http.get<Tag[]>(`${this.base}/suggest`, { params });
  }

  create(dto: CreateTagDto): Observable<Tag> {
    return this.http.post<Tag>(this.base, dto);
  }
}
