import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PlatformApiService } from '../../core/api/platform-api.service';
import { PromptApiService } from '../../core/api/prompt-api.service';
import type { Prompt, Tag } from '../../core/models/index';
import { TagApiService } from '../../core/api/tag-api.service';
import { TagBadgeComponent } from '../../shared/components/tag-badge.component';
import { TagStore } from '../../state/tag.store';

type ActiveFilter = {
  key: 'query' | 'platform' | 'skill' | 'mcp' | 'tag' | 'clause';
  label: string;
  value: string;
  tagId?: number;
};

type FilterKey = 'platform' | 'skill' | 'mcp' | 'tag' | 'clause';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [RouterLink, FormsModule, TagBadgeComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-100">Discover</h1>
        <p class="text-sm text-slate-500 mt-1">Community prompts — ready to use.</p>
      </div>

      <div class="space-y-3" aria-label="Discover filters">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div class="lg:col-span-2">
            <label for="discover-search" class="text-xs text-slate-500 mb-1 block">Search</label>
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/>
              </svg>
              <input
                id="discover-search"
                [(ngModel)]="query"
                (ngModelChange)="search()"
                type="search"
                placeholder="Search prompts…"
                class="glass-input pl-9 pr-4 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label for="discover-clause-filter" class="text-xs text-slate-500 mb-1 block">Match mode</label>
            <select
              id="discover-clause-filter"
              [(ngModel)]="clauseMode"
              (ngModelChange)="search()"
              class="glass-input glass-select px-3 py-2 text-sm cursor-pointer"
              [style]="multiselectStyle('clause', clauseMode === 'or')"
            >
              <option value="and">All groups (AND)</option>
              <option value="or">Any group (OR)</option>
            </select>
          </div>

          <div>
            <label for="discover-tools-filter" class="text-xs text-slate-500 mb-1 block">Tools</label>
            <div class="relative" data-multiselect-root="true">
              <button
                id="discover-tools-filter"
                type="button"
                (click)="toggleDropdown('platform')"
                class="glass-input glass-select px-3 py-2 text-sm cursor-pointer text-left"
                [style]="multiselectStyle('platform', selectedPlatforms().size > 0)"
                aria-haspopup="listbox"
                [attr.aria-expanded]="platformDropdownOpen()"
                aria-controls="discover-tools-options"
              >
                {{ selectionLabel(selectedPlatforms().size, 'All tools', 'tool') }}
              </button>
              @if (platformDropdownOpen()) {
                <div
                  id="discover-tools-options"
                  class="absolute z-20 mt-1 w-full rounded-lg border p-2 space-y-2"
                  role="listbox"
                  aria-label="Tool options"
                  [style]="dropdownPanelStyle('platform')"
                >
                  <label for="discover-tools-search" class="sr-only">Search tools</label>
                  <input
                    id="discover-tools-search"
                    [(ngModel)]="platformFilterQuery"
                    type="search"
                    placeholder="Search tools…"
                    class="glass-input px-3 py-1.5 text-xs w-full"
                  />
                  <div class="max-h-56 overflow-auto space-y-1">
                    @if (filteredPlatformOptions().length === 0) {
                      <p class="px-2 py-2 text-xs text-slate-500">No matching tools.</p>
                    } @else {
                      @for (option of filteredPlatformOptions(); track option) {
                        <button
                          type="button"
                          (click)="togglePlatform(option)"
                          class="w-full text-left px-2 py-1.5 rounded text-xs cursor-pointer flex items-center gap-2"
                          [style]="optionStyle('platform', selectedPlatforms().has(option))"
                        >
                          <span class="flex-1">{{ option }}</span>
                          @if (selectedPlatforms().has(option)) {
                            <span>✓</span>
                          }
                        </button>
                      }
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <div>
            <label for="discover-skills-filter" class="text-xs text-slate-500 mb-1 block">Skills</label>
            <div class="relative" data-multiselect-root="true">
              <button
                id="discover-skills-filter"
                type="button"
                (click)="toggleDropdown('skill')"
                class="glass-input glass-select px-3 py-2 text-sm cursor-pointer text-left"
                [style]="multiselectStyle('skill', selectedSkills().size > 0)"
                aria-haspopup="listbox"
                [attr.aria-expanded]="skillDropdownOpen()"
                aria-controls="discover-skills-options"
              >
                {{ selectionLabel(selectedSkills().size, 'All skills', 'skill') }}
              </button>
              @if (skillDropdownOpen()) {
                <div
                  id="discover-skills-options"
                  class="absolute z-20 mt-1 w-full rounded-lg border p-2 space-y-2"
                  role="listbox"
                  aria-label="Skill options"
                  [style]="dropdownPanelStyle('skill')"
                >
                  <label for="discover-skills-search" class="sr-only">Search skills</label>
                  <input
                    id="discover-skills-search"
                    [(ngModel)]="skillFilterQuery"
                    type="search"
                    placeholder="Search skills…"
                    class="glass-input px-3 py-1.5 text-xs w-full"
                  />
                  <div class="max-h-56 overflow-auto space-y-1">
                    @if (filteredSkillOptions().length === 0) {
                      <p class="px-2 py-2 text-xs text-slate-500">No matching skills.</p>
                    } @else {
                      @for (option of filteredSkillOptions(); track option) {
                        <button
                          type="button"
                          (click)="toggleSkill(option)"
                          class="w-full text-left px-2 py-1.5 rounded text-xs cursor-pointer flex items-center gap-2"
                          [style]="optionStyle('skill', selectedSkills().has(option))"
                        >
                          <span class="flex-1">{{ option }}</span>
                          @if (selectedSkills().has(option)) {
                            <span>✓</span>
                          }
                        </button>
                      }
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <div>
            <label for="discover-mcps-filter" class="text-xs text-slate-500 mb-1 block">MCP servers</label>
            <div class="relative" data-multiselect-root="true">
              <button
                id="discover-mcps-filter"
                type="button"
                (click)="toggleDropdown('mcp')"
                class="glass-input glass-select px-3 py-2 text-sm cursor-pointer text-left"
                [style]="multiselectStyle('mcp', selectedMcps().size > 0)"
                aria-haspopup="listbox"
                [attr.aria-expanded]="mcpDropdownOpen()"
                aria-controls="discover-mcps-options"
              >
                {{ selectionLabel(selectedMcps().size, 'All MCPs', 'MCP') }}
              </button>
              @if (mcpDropdownOpen()) {
                <div
                  id="discover-mcps-options"
                  class="absolute z-20 mt-1 w-full rounded-lg border p-2 space-y-2"
                  role="listbox"
                  aria-label="MCP options"
                  [style]="dropdownPanelStyle('mcp')"
                >
                  <label for="discover-mcps-search" class="sr-only">Search MCP servers</label>
                  <input
                    id="discover-mcps-search"
                    [(ngModel)]="mcpFilterQuery"
                    type="search"
                    placeholder="Search MCPs…"
                    class="glass-input px-3 py-1.5 text-xs w-full"
                  />
                  <div class="max-h-56 overflow-auto space-y-1">
                    @if (filteredMcpOptions().length === 0) {
                      <p class="px-2 py-2 text-xs text-slate-500">No matching MCP servers.</p>
                    } @else {
                      @for (option of filteredMcpOptions(); track option) {
                        <button
                          type="button"
                          (click)="toggleMcp(option)"
                          class="w-full text-left px-2 py-1.5 rounded text-xs cursor-pointer flex items-center gap-2"
                          [style]="optionStyle('mcp', selectedMcps().has(option))"
                        >
                          <span class="flex-1">{{ option }}</span>
                          @if (selectedMcps().has(option)) {
                            <span>✓</span>
                          }
                        </button>
                      }
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="max-w-sm">
          <label for="discover-tags-filter" class="text-xs text-slate-500 mb-1 block">Tags</label>
          <div class="relative" data-multiselect-root="true">
            <button
              id="discover-tags-filter"
              type="button"
              (click)="toggleDropdown('tag')"
              class="glass-input glass-select px-3 py-2 text-sm cursor-pointer text-left"
              [style]="multiselectStyle('tag', selectedTagIds().size > 0)"
              aria-haspopup="listbox"
              [attr.aria-expanded]="tagDropdownOpen()"
              aria-controls="discover-tag-options"
            >
              {{ selectionLabel(selectedTagIds().size, 'All tags', 'tag') }}
            </button>
            @if (tagDropdownOpen()) {
              <div
                id="discover-tag-options"
                class="absolute z-20 mt-1 w-full rounded-lg border p-2 space-y-2"
                role="listbox"
                aria-label="Tag options"
                [style]="dropdownPanelStyle('tag')"
              >
                <label for="discover-tags-search" class="sr-only">Search tags</label>
                <input
                  id="discover-tags-search"
                  [(ngModel)]="tagFilterQuery"
                  (ngModelChange)="onTagFilterInput()"
                  type="search"
                  placeholder="Search tags…"
                  class="glass-input px-3 py-1.5 text-xs w-full"
                />
                <div class="max-h-56 overflow-auto space-y-1">
                  @if (tagOptions().length === 0) {
                    <p class="px-2 py-2 text-xs text-slate-500">No matching tags. Try a different keyword.</p>
                  } @else {
                    @for (tag of tagOptions(); track tag.id) {
                      <button
                        type="button"
                        (click)="toggleTag(tag.id)"
                        class="w-full text-left px-2 py-1.5 rounded text-xs cursor-pointer flex items-center gap-2"
                        [style]="optionStyle('tag', selectedTagIds().has(tag.id))"
                      >
                        <span class="w-2 h-2 rounded-full" [style.background-color]="tag.color"></span>
                        <span class="flex-1">{{ tag.name }}</span>
                        @if (selectedTagIds().has(tag.id)) {
                          <span>✓</span>
                        }
                      </button>
                    }
                  }
                </div>
              </div>
            }
          </div>
        </div>

        @if (activeFilters().length > 0) {
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-3">
              <p class="text-xs text-slate-500">Applied filters ({{ activeFilterCount() }})</p>
              <button
                type="button"
                (click)="clearFilters()"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer"
                style="background:rgba(239,68,68,0.08);border-color:rgba(239,68,68,0.25);color:#f87171"
              >
                Clear all
              </button>
            </div>
            <div class="flex flex-wrap gap-1.5">
              @for (filter of activeFilters(); track filter.key + ':' + filter.value + ':' + (filter.tagId ?? '')) {
                <button
                  type="button"
                  (click)="removeFilter(filter)"
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border cursor-pointer transition-colors"
                  [style]="chipStyle(filter)"
                  [attr.aria-label]="'Remove filter ' + filter.label + ': ' + filter.value"
                >
                  <span class="text-slate-300/90">{{ filter.label }}:</span>
                  <span>{{ filter.value }}</span>
                  <span aria-hidden="true">×</span>
                </button>
              }
            </div>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="glass-card p-5 animate-pulse space-y-2">
              <div class="h-4 bg-white/5 rounded w-2/3"></div>
              <div class="h-3 bg-white/5 rounded w-full"></div>
            </div>
          }
        </div>
      } @else if (prompts().length === 0) {
        <div class="text-center py-16 text-slate-500 text-sm">No public prompts found.</div>
      } @else {
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          @for (p of prompts(); track p.id) {
            <a [routerLink]="['/discover', p.id]"
              class="glass-card p-5 block hover:border-indigo-500/30 transition-colors group">
              <div class="flex items-start justify-between gap-2">
                <h3 class="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">{{ p.title }}</h3>
                <div class="flex items-center gap-3 shrink-0 text-xs text-slate-500">
                  <span class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M1 8.25a1.25 1.25 0 1 1 2.5 0v7.5a1.25 1.25 0 0 1-2.5 0v-7.5ZM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0 1 14 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 0 1-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 0 1-1.341-.317l-2.734-1.366A3 3 0 0 0 6.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 0 1 2.166-1.73c.432-.143.853-.386 1.011-.76A2.8 2.8 0 0 0 11 3Z"/></svg>
                    {{ p.like_count }}
                  </span>
                  <span class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M18.905 12.75a1.25 1.25 0 0 1-2.5 0v-7.5a1.25 1.25 0 0 1 2.5 0v7.5ZM8.905 17v1.3c0 .268-.14.526-.395.607A2 2 0 0 1 5.905 17c0-.995.182-1.948.514-2.826.204-.54-.166-1.174-.744-1.174h-2.52c-1.243 0-2.261-1.01-2.146-2.247.193-2.08.652-4.082 1.341-5.974C2.752 3.678 3.833 3 5.005 3h3.192a3 3 0 0 1 1.341.317l2.734 1.366A3 3 0 0 0 13.613 5h1.292v7h-.963c-.685 0-1.258.483-1.612 1.068a4.011 4.011 0 0 1-2.166 1.73c-.432.143-.853.386-1.011.76a2.8 2.8 0 0 0-.24 1.142Z"/></svg>
                    {{ p.dislike_count }}
                  </span>
                  @if (p.vem_use_count && p.vem_use_count > 0) {
                    <span class="flex items-center gap-1 text-emerald-500">
                      <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 1.06L4.874 5.346a.75.75 0 0 1-1.06-1.06L5.05 3.05Zm9.9 0a.75.75 0 0 1 0 1.06L13.713 5.35a.75.75 0 1 1-1.06-1.061l1.238-1.238a.75.75 0 0 1 1.06 0ZM10 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-3.5 2a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15Zm-4.136-1.086a.75.75 0 0 1 0 1.06l-1.238 1.24a.75.75 0 0 1-1.06-1.062l1.238-1.238a.75.75 0 0 1 1.06 0Zm9.272 0a.75.75 0 0 1 1.06 0l1.238 1.238a.75.75 0 1 1-1.06 1.061l-1.238-1.238a.75.75 0 0 1 0-1.06ZM3 10a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5H2.25A.75.75 0 0 1 3 10Zm16.25 0a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 19.25 10Z" clip-rule="evenodd" /></svg>
                      {{ p.vem_use_count }}
                    </span>
                  }
                </div>
              </div>
              @if (p.description) {
                <p class="text-xs text-slate-500 mt-1 line-clamp-2">{{ p.description }}</p>
              }
              @if (p.creator_username) {
                <p class="text-xs text-slate-600 mt-2">by {{ p.creator_username }}</p>
              }
              @if (p.tag_ids.length > 0) {
                <div class="flex flex-wrap gap-1 mt-3">
                  @for (tagId of p.tag_ids; track tagId) {
                    @if (tagStore.tagMap().get(tagId); as tag) {
                      <app-tag-badge [tag]="tag" />
                    }
                  }
                </div>
              }
              @if (p.requirements) {
                <div class="flex flex-wrap gap-1 mt-2">
                  @for (pl of p.requirements.platforms; track pl) {
                    <span class="px-1.5 py-0.5 text-xs rounded font-medium"
                      style="background:rgba(245,158,11,0.12);color:#fcd34d">{{ pl }}</span>
                  }
                  @for (s of p.requirements.skills; track s) {
                    <span class="px-1.5 py-0.5 text-xs rounded font-medium"
                      style="background:rgba(99,102,241,0.12);color:#a5b4fc">{{ s }}</span>
                  }
                  @for (m of p.requirements.mcpServers; track m) {
                    <span class="px-1.5 py-0.5 text-xs rounded font-medium"
                      style="background:rgba(16,185,129,0.12);color:#6ee7b7">{{ m }}</span>
                  }
                </div>
              }
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class DiscoverComponent implements OnInit {
  private readonly api = inject(PromptApiService);
  private readonly platformApi = inject(PlatformApiService);
  private readonly tagApi = inject(TagApiService);
  readonly tagStore = inject(TagStore);

  private readonly filterTheme: Record<FilterKey, { border: string; text: string; softBg: string }> = {
    platform: { border: 'rgba(245,158,11,0.35)', text: '#fcd34d', softBg: 'rgba(245,158,11,0.16)' },
    skill: { border: 'rgba(99,102,241,0.35)', text: '#c7d2fe', softBg: 'rgba(99,102,241,0.16)' },
    mcp: { border: 'rgba(16,185,129,0.35)', text: '#99f6e4', softBg: 'rgba(16,185,129,0.16)' },
    tag: { border: 'rgba(217,70,239,0.35)', text: '#f5d0fe', softBg: 'rgba(217,70,239,0.16)' },
    clause: { border: 'rgba(56,189,248,0.35)', text: '#bae6fd', softBg: 'rgba(56,189,248,0.16)' },
  };

  readonly prompts = signal<Prompt[]>([]);
  readonly loading = signal(true);
  readonly allPlatforms = signal<string[]>([]);
  readonly skillOptions = signal<string[]>([]);
  readonly mcpOptions = signal<string[]>([]);

  readonly selectedPlatforms = signal<Set<string>>(new Set());
  readonly selectedSkills = signal<Set<string>>(new Set());
  readonly selectedMcps = signal<Set<string>>(new Set());
  readonly selectedTagIds = signal<Set<number>>(new Set());

  readonly platformDropdownOpen = signal(false);
  readonly skillDropdownOpen = signal(false);
  readonly mcpDropdownOpen = signal(false);
  readonly tagDropdownOpen = signal(false);
  readonly tagOptions = signal<Tag[]>([]);

  query = '';
  clauseMode: 'and' | 'or' = 'and';
  platformFilterQuery = '';
  skillFilterQuery = '';
  mcpFilterQuery = '';
  tagFilterQuery = '';

  readonly activeFilters = computed(() => {
    const filters: ActiveFilter[] = [];
    if (this.query.trim()) filters.push({ key: 'query', label: 'Search', value: this.query.trim() });
    if (this.clauseMode === 'or') filters.push({ key: 'clause', label: 'Match', value: 'Any group (OR)' });
    for (const value of this.selectedPlatforms()) filters.push({ key: 'platform', label: 'Tool', value });
    for (const value of this.selectedSkills()) filters.push({ key: 'skill', label: 'Skill', value });
    for (const value of this.selectedMcps()) filters.push({ key: 'mcp', label: 'MCP', value });
    for (const id of this.selectedTagIds()) {
      const tagName = this.tagStore.tagMap().get(id)?.name ?? `Tag #${id}`;
      filters.push({ key: 'tag', label: 'Tag', value: tagName, tagId: id });
    }
    return filters;
  });
  readonly activeFilterCount = computed(() => this.activeFilters().length);

  ngOnInit(): void {
    this.tagStore.load();
    this.loadDefaultTagOptions();
    this.platformApi.getAll().subscribe(({ predefined, custom }) => {
      this.allPlatforms.set([...predefined, ...custom]);
    });
    this.api.getPublicOptions().subscribe(({ skills, mcps }) => {
      this.skillOptions.set(skills);
      this.mcpOptions.set(mcps);
    });
    this.search();
  }

  selectionLabel(count: number, allLabel: string, singularLabel: string): string {
    if (count === 0) return allLabel;
    if (count === 1) return `1 ${singularLabel} selected`;
    return `${count} ${singularLabel}s selected`;
  }

  multiselectStyle(key: FilterKey, active: boolean): string {
    const theme = this.filterTheme[key];
    if (active) {
      return `border-color:${theme.border};color:${theme.text};background:${theme.softBg}`;
    }
    return `border-color:${theme.border};color:${theme.text}`;
  }

  dropdownPanelStyle(key: FilterKey): string {
    const theme = this.filterTheme[key];
    return `background:rgba(15,15,25,0.98);border-color:${theme.border};box-shadow:0 8px 32px rgba(0,0,0,0.4)`;
  }

  optionStyle(key: FilterKey, selected: boolean): string {
    if (!selected) return 'color:#94a3b8';
    const theme = this.filterTheme[key];
    return `background:${theme.softBg};color:${theme.text}`;
  }

  chipStyle(filter: ActiveFilter): string {
    if (filter.key === 'query') {
      return 'background:rgba(148,163,184,0.14);border-color:rgba(148,163,184,0.35);color:#cbd5e1';
    }
    if (filter.key === 'clause') {
      const theme = this.filterTheme.clause;
      return `background:${theme.softBg};border-color:${theme.border};color:${theme.text}`;
    }
    const theme = this.filterTheme[filter.key];
    return `background:${theme.softBg};border-color:${theme.border};color:${theme.text}`;
  }

  private filterOptions(options: string[], q: string): string[] {
    const normalized = q.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((value) => value.toLowerCase().includes(normalized));
  }

  filteredPlatformOptions(): string[] {
    return this.filterOptions(this.allPlatforms(), this.platformFilterQuery);
  }

  filteredSkillOptions(): string[] {
    return this.filterOptions(this.skillOptions(), this.skillFilterQuery);
  }

  filteredMcpOptions(): string[] {
    return this.filterOptions(this.mcpOptions(), this.mcpFilterQuery);
  }

  toggleDropdown(kind: 'platform' | 'skill' | 'mcp' | 'tag'): void {
    const next = {
      platform: kind === 'platform' ? !this.platformDropdownOpen() : false,
      skill: kind === 'skill' ? !this.skillDropdownOpen() : false,
      mcp: kind === 'mcp' ? !this.mcpDropdownOpen() : false,
      tag: kind === 'tag' ? !this.tagDropdownOpen() : false,
    };
    this.platformDropdownOpen.set(next.platform);
    this.skillDropdownOpen.set(next.skill);
    this.mcpDropdownOpen.set(next.mcp);
    this.tagDropdownOpen.set(next.tag);
  }

  private closeAllDropdowns(): void {
    this.platformDropdownOpen.set(false);
    this.skillDropdownOpen.set(false);
    this.mcpDropdownOpen.set(false);
    this.tagDropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('[data-multiselect-root="true"]')) return;
    this.closeAllDropdowns();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeAllDropdowns();
  }

  togglePlatform(value: string): void {
    this.selectedPlatforms.update((cur) => {
      const next = new Set(cur);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
    this.search();
  }

  toggleSkill(value: string): void {
    this.selectedSkills.update((cur) => {
      const next = new Set(cur);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
    this.search();
  }

  toggleMcp(value: string): void {
    this.selectedMcps.update((cur) => {
      const next = new Set(cur);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
    this.search();
  }

  toggleTag(id: number): void {
    this.selectedTagIds.update((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    this.search();
  }

  onTagFilterInput(): void {
    const q = this.tagFilterQuery.trim();
    if (!q) {
      this.loadDefaultTagOptions();
      return;
    }
    this.tagApi.suggest(q, 25).subscribe((tags) => this.tagOptions.set(tags));
  }

  private loadDefaultTagOptions(): void {
    this.tagApi.listDefaults().subscribe((tags) => this.tagOptions.set(tags));
  }

  clearFilters(): void {
    this.query = '';
    this.clauseMode = 'and';
    this.platformFilterQuery = '';
    this.skillFilterQuery = '';
    this.mcpFilterQuery = '';
    this.tagFilterQuery = '';
    this.selectedPlatforms.set(new Set());
    this.selectedSkills.set(new Set());
    this.selectedMcps.set(new Set());
    this.selectedTagIds.set(new Set());
    this.loadDefaultTagOptions();
    this.search();
  }

  removeFilter(filter: ActiveFilter): void {
    if (filter.key === 'query') this.query = '';
    else if (filter.key === 'clause') this.clauseMode = 'and';
    else if (filter.key === 'platform') {
      this.selectedPlatforms.update((cur) => {
        const next = new Set(cur);
        next.delete(filter.value);
        return next;
      });
    } else if (filter.key === 'skill') {
      this.selectedSkills.update((cur) => {
        const next = new Set(cur);
        next.delete(filter.value);
        return next;
      });
    } else if (filter.key === 'mcp') {
      this.selectedMcps.update((cur) => {
        const next = new Set(cur);
        next.delete(filter.value);
        return next;
      });
    } else if (filter.key === 'tag') {
      const id = filter.tagId;
      if (id === undefined) return;
      this.selectedTagIds.update((cur) => {
        const next = new Set(cur);
        next.delete(id);
        return next;
      });
    }
    this.search();
  }

  search(): void {
    this.loading.set(true);
    this.api.listPublic(
      this.query || undefined,
      this.selectedPlatforms().size > 0 ? [...this.selectedPlatforms()] : undefined,
      this.selectedTagIds().size > 0 ? [...this.selectedTagIds()] : undefined,
      this.selectedSkills().size > 0 ? [...this.selectedSkills()] : undefined,
      this.selectedMcps().size > 0 ? [...this.selectedMcps()] : undefined,
      this.clauseMode,
    ).subscribe({
      next: (ps) => { this.prompts.set(ps); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
