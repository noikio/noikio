import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PlatformList {
  predefined: string[];
  custom: string[];
}

@Injectable({ providedIn: 'root' })
export class PlatformApiService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<PlatformList> {
    return this.http.get<PlatformList>('/api/platforms');
  }

  addCustom(name: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>('/api/platforms', { name });
  }
}
