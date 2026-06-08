import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Prompt, PromptVersion } from '../models/index';

@Injectable({ providedIn: 'root' })
export class VersionApiService {
  private readonly http = inject(HttpClient);

  list(promptId: number): Observable<PromptVersion[]> {
    return this.http.get<PromptVersion[]>(`/api/prompts/${promptId}/versions`);
  }

  getById(promptId: number, versionId: number): Observable<PromptVersion> {
    return this.http.get<PromptVersion>(`/api/prompts/${promptId}/versions/${versionId}`);
  }

  restore(promptId: number, versionId: number): Observable<Prompt> {
    return this.http.post<Prompt>(`/api/prompts/${promptId}/versions/${versionId}/restore`, {});
  }
}
