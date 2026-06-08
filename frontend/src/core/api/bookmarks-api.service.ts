import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Prompt } from '../models/index';

@Injectable({ providedIn: 'root' })
export class BookmarksApiService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Prompt[]> {
    return this.http.get<Prompt[]>('/api/bookmarks');
  }

  add(promptId: number): Observable<{ bookmarked: boolean }> {
    return this.http.post<{ bookmarked: boolean }>(`/api/prompts/${promptId}/bookmark`, {});
  }

  remove(promptId: number): Observable<{ bookmarked: boolean }> {
    return this.http.delete<{ bookmarked: boolean }>(`/api/prompts/${promptId}/bookmark`);
  }
}
