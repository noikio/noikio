import { inject, Injectable, signal, computed } from '@angular/core';
import { TagApiService, type CreateTagDto } from '../core/api/tag-api.service';
import type { Tag } from '../core/models/index';

@Injectable({ providedIn: 'root' })
export class TagStore {
  private readonly api = inject(TagApiService);

  private readonly _tags = signal<Tag[]>([]);
  private readonly _defaultTags = signal<Tag[]>([]);
  private readonly _suggestions = signal<Tag[]>([]);
  private readonly _loading = signal(false);

  readonly tags = this._tags.asReadonly();
  readonly defaultTags = this._defaultTags.asReadonly();
  readonly suggestions = this._suggestions.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly tagMap = computed(() =>
    new Map(this._tags().map((t) => [t.id, t]))
  );

  load(): void {
    if (this._tags().length > 0) return;
    this._loading.set(true);
    this.api.list().subscribe({
      next: (tags) => {
        this._tags.set(tags);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  reload(): void {
    this._tags.set([]);
    this.load();
  }

  loadDefaults(): void {
    this.api.listDefaults().subscribe((tags) => this._defaultTags.set(tags));
  }

  suggest(q?: string, limit = 20): void {
    this.api.suggest(q, limit).subscribe((tags) => this._suggestions.set(tags));
  }

  clearSuggestions(): void {
    this._suggestions.set([]);
  }

  create(dto: CreateTagDto, onDone?: (tag: Tag) => void): void {
    this.api.create(dto).subscribe((tag) => {
      this._tags.update((tags) => {
        if (tags.some((t) => t.id === tag.id)) return tags;
        return [...tags, tag].sort((a, b) => a.name.localeCompare(b.name));
      });
      if (tag.is_system) {
        this._defaultTags.update((tags) =>
          tags.some((t) => t.id === tag.id) ? tags : [...tags, tag].sort((a, b) => a.name.localeCompare(b.name))
        );
      }
      onDone?.(tag);
    });
  }
}
