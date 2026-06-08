import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Prompt, PromptRequirements } from '../models/index';

export interface CreatePromptDto {
  title: string;
  content: string;
  description?: string;
  tagIds?: number[];
  visibility?: 'private' | 'public';
  requirements?: PromptRequirements;
}

export interface UpdatePromptDto {
  title?: string;
  content?: string;
  description?: string;
  tagIds?: number[];
  visibility?: 'private' | 'public';
  requirements?: PromptRequirements;
}

@Injectable({ providedIn: 'root' })
export class PromptApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/prompts';

  list(q?: string, tagIds?: number[]): Observable<Prompt[]> {
    const params: Record<string, string> = {};
    if (q) params['q'] = q;
    if (tagIds && tagIds.length === 1) params['tag'] = String(tagIds[0]);
    if (tagIds && tagIds.length > 1) params['tags'] = tagIds.join(',');
    return this.http.get<Prompt[]>(this.base, { params });
  }

  getById(id: number): Observable<Prompt> {
    return this.http.get<Prompt>(`${this.base}/${id}`);
  }

  create(dto: CreatePromptDto): Observable<Prompt> {
    return this.http.post<Prompt>(this.base, dto);
  }

  update(id: number, dto: UpdatePromptDto): Observable<Prompt> {
    return this.http.put<Prompt>(`${this.base}/${id}`, dto);
  }

  delete(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`);
  }

  listPublic(
    q?: string,
    platforms?: string[],
    tagIds?: number[],
    skills?: string[],
    mcps?: string[],
    clauseMode?: 'and' | 'or',
  ): Observable<Prompt[]> {
    const params: Record<string, string> = {};
    if (q) params['q'] = q;
    if (platforms && platforms.length === 1) params['platform'] = platforms[0];
    if (platforms && platforms.length > 1) params['platforms'] = platforms.join(',');
    if (tagIds && tagIds.length === 1) params['tag'] = String(tagIds[0]);
    if (tagIds && tagIds.length > 1) params['tags'] = tagIds.join(',');
    if (skills && skills.length === 1) params['skill'] = skills[0];
    if (skills && skills.length > 1) params['skills'] = skills.join(',');
    if (mcps && mcps.length === 1) params['mcp'] = mcps[0];
    if (mcps && mcps.length > 1) params['mcps'] = mcps.join(',');
    if (clauseMode) params['clause'] = clauseMode;
    return this.http.get<Prompt[]>(`${this.base}/public`, { params });
  }

  getPublicOptions(): Observable<{ skills: string[]; mcps: string[] }> {
    return this.http.get<{ skills: string[]; mcps: string[] }>(`${this.base}/public/options`);
  }

  getPublic(id: number): Observable<Prompt> {
    return this.http.get<Prompt>(`${this.base}/public/${id}`);
  }

  rate(id: number, rating: 'like' | 'dislike'): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/${id}/rate`, { rating });
  }

  unrate(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}/rate`);
  }

  fork(id: number): Observable<{ id: number; forked_from_id: number }> {
    return this.http.post<{ id: number; forked_from_id: number }>(`${this.base}/${id}/fork`, {});
  }

  trackVemClick(id: number): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/${id}/vem`, {});
  }

  generateRunToken(id: number): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.base}/${id}/run-token`, {});
  }
}
