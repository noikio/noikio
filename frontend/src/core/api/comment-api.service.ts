import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Comment } from '../models/index';

@Injectable({ providedIn: 'root' })
export class CommentApiService {
  private readonly http = inject(HttpClient);

  list(promptId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`/api/prompts/${promptId}/comments`);
  }

  create(promptId: number, body: string, parentId?: number): Observable<Comment> {
    return this.http.post<Comment>(`/api/prompts/${promptId}/comments`, {
      body,
      ...(parentId !== undefined ? { parentId } : {}),
    });
  }

  vote(promptId: number, commentId: number, vote: 'up' | 'down'): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`/api/prompts/${promptId}/comments/${commentId}/vote`, { vote });
  }

  removeVote(promptId: number, commentId: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`/api/prompts/${promptId}/comments/${commentId}/vote`);
  }

  delete(promptId: number, commentId: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`/api/prompts/${promptId}/comments/${commentId}`);
  }
}
