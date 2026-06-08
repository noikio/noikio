import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { PromptStore } from '../../state/prompt.store';
import { TagStore } from '../../state/tag.store';
import { PlatformApiService } from '../../core/api/platform-api.service';
import type { PromptRequirements, Tag } from '../../core/models/index';

@Component({
  selector: 'app-prompt-editor',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-2xl mx-auto">
      <div class="mb-7">
        <a
          routerLink="/prompts"
          class="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-3 transition-colors"
        >
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path
              d="M7.78 2.22a.75.75 0 0 1 0 1.06L5.06 6l2.72 2.72a.75.75 0 1 1-1.06 1.06L3.47 6.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z"
            />
          </svg>
          All prompts
        </a>
        <h1 class="text-2xl font-semibold text-slate-100">
          {{ isEdit() ? 'Edit Prompt' : 'New Prompt' }}
        </h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5"
            >Title <span class="text-red-400">*</span></label
          >
          <input
            formControlName="title"
            type="text"
            autocomplete="off"
            class="glass-input px-3 py-2.5 text-sm"
            [style]="
              titleInvalid()
                ? 'border-color:rgba(239,68,68,0.5);box-shadow:0 0 0 3px rgba(239,68,68,0.1)'
                : ''
            "
          />
          @if (titleInvalid()) {
            <p class="text-xs text-red-400 mt-1.5">Title is required.</p>
          }
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
          <input
            formControlName="description"
            type="text"
            autocomplete="off"
            class="glass-input px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs font-medium text-slate-400"
              >Content <span class="text-red-400">*</span></label
            >
            <span class="text-xs text-slate-600">
              Use
              <code
                class="font-mono text-indigo-400 px-1 py-0.5 rounded text-xs"
                style="background:rgba(99,102,241,0.12)"
                >{{ templateHint }}</code
              >
              for variables
            </span>
          </div>
          <textarea
            formControlName="content"
            rows="12"
            class="glass-input px-3 py-3 text-sm leading-relaxed resize-y"
            style="font-family:'JetBrains Mono',ui-monospace,monospace"
            [style.border-color]="contentInvalid() ? 'rgba(239,68,68,0.5)' : ''"
          ></textarea>
          @if (contentInvalid()) {
            <p class="text-xs text-red-400 mt-1.5">Content is required.</p>
          }
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-medium text-slate-400 mb-2">Tags</label>
          <div class="flex flex-wrap gap-2">
            @for (tag of tagStore.defaultTags(); track tag.id) {
              <button
                type="button"
                (click)="toggleTag(tag.id)"
                class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer"
                [style]="
                  selectedTags().has(tag.id)
                    ? 'background:rgba(255,255,255,0.09);border-color:' +
                      tag.color +
                      ';color:#e2e8f0;box-shadow:0 0 8px ' +
                      tag.color +
                      '44'
                    : 'background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.09);color:#64748b'
                "
              >
                <span class="w-1.5 h-1.5 rounded-full" [style.background-color]="tag.color"></span>
                {{ tag.name }}
              </button>
            }
          </div>
          @if (selectedUserTags().length > 0) {
            <div class="flex flex-wrap gap-1.5">
              @for (tag of selectedUserTags(); track tag.id) {
                <span
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full border"
                  style="background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.15);color:#cbd5e1"
                >
                  <span class="w-1.5 h-1.5 rounded-full" [style.background-color]="tag.color"></span>
                  {{ tag.name }}
                  <button type="button" (click)="toggleTag(tag.id)" class="cursor-pointer hover:text-red-400">×</button>
                </span>
              }
            </div>
          }
            <div class="relative">
              <div class="flex gap-2">
                <input
                  [(ngModel)]="newTag"
                  [ngModelOptions]="{ standalone: true }"
                  (input)="onTagInput()"
                  (keydown.enter)="$event.preventDefault(); addNewTag()"
                  (keydown.escape)="tagSuggestionsOpen.set(false)"
                  (blur)="onTagBlur()"
                  type="text"
                  placeholder="Add a tag…"
                  class="glass-input px-3 py-1.5 text-xs flex-1"
                />
                <input
                  [(ngModel)]="newTagColor"
                  [ngModelOptions]="{ standalone: true }"
                  type="color"
                  title="Pick tag color"
                  class="h-8 w-10 rounded border cursor-pointer p-0.5 shrink-0"
                  style="background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.09)"
                />
                <button type="button" (click)="addNewTag()" class="btn-ghost px-3 py-1.5 text-xs">
                  Add
                </button>
              </div>
              @if (tagSuggestionsOpen() && filteredTagSuggestions().length > 0) {
                <div
                  class="absolute z-10 w-full mt-1 rounded-lg border overflow-hidden"
                  style="background:rgba(15,15,25,0.95);border-color:rgba(255,255,255,0.1);box-shadow:0 8px 32px rgba(0,0,0,0.4)"
                >
                  @for (tag of filteredTagSuggestions(); track tag.id) {
                    <button
                      type="button"
                      (mousedown)="$event.preventDefault(); selectTagSuggestion(tag)"
                      class="w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer flex items-center gap-2"
                      style="color:#94a3b8"
                      onmouseover="this.style.background='rgba(99,102,241,0.12)';this.style.color='#c7d2fe'"
                      onmouseout="this.style.background='';this.style.color='#94a3b8'"
                    >
                      <span class="w-2 h-2 rounded-full" [style.background-color]="tag.color"></span>
                      {{ tag.name }}
                    </button>
                  }
                </div>
              }
            </div>
        </div>

        <!-- Visibility -->
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-2">Visibility</label>
          <div class="flex gap-3">
            <button
              type="button"
              (click)="visibility.set('private')"
              class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all cursor-pointer"
              [style]="
                visibility() === 'private'
                  ? 'background:rgba(99,102,241,0.15);border-color:rgba(99,102,241,0.4);color:#a5b4fc'
                  : 'background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.09);color:#64748b'
              "
            >
              <svg
                class="w-3.5 h-3.5 shrink-0"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z"
                  clip-rule="evenodd"
                />
              </svg>
              Private
            </button>
            <button
              type="button"
              (click)="visibility.set('public')"
              class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all cursor-pointer"
              [style]="
                visibility() === 'public'
                  ? 'background:rgba(99,102,241,0.15);border-color:rgba(99,102,241,0.4);color:#a5b4fc'
                  : 'background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.09);color:#64748b'
              "
            >
              <svg
                class="w-3.5 h-3.5 shrink-0"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM3.69 6.5h1.67c.1-.9.28-1.73.53-2.45a4.52 4.52 0 0 0-2.2 2.45ZM3.1 8a4.4 4.4 0 0 0 .1.9 4.4 4.4 0 0 0-.1.9V8Zm.59 1.5a4.52 4.52 0 0 0 2.2 2.45c-.25-.72-.43-1.55-.53-2.45H3.68ZM7.25 9.5c.05.86.2 1.63.43 2.25.14.38.3.67.46.85.15.18.27.24.36.24.09 0 .21-.06.36-.24.16-.18.32-.47.46-.85.23-.62.38-1.39.43-2.25H7.25Zm2.5 0c-.1.9-.28 1.73-.53 2.45a4.52 4.52 0 0 0 2.2-2.45H9.75ZM12.31 8a4.4 4.4 0 0 0-.1-.9 4.4 4.4 0 0 0 .1-.9v1.8Zm-.59-1.5H10.06c-.1-.9-.28-1.73-.53-2.45a4.52 4.52 0 0 1 2.2 2.45ZM7.25 6.5h1.5c-.05-.86-.2-1.63-.43-2.25C8.18 3.87 8.02 3.58 7.86 3.4 7.71 3.22 7.59 3.16 7.5 3.16c-.09 0-.21.06-.36.24-.16.18-.32.47-.46.85C6.45 4.87 6.3 5.64 6.25 6.5h1Z"
                />
              </svg>
              Public
            </button>
          </div>
          @if (visibility() === 'public') {
            <p class="text-xs text-slate-600 mt-1.5">Visible to everyone in Discover.</p>
          }
        </div>

        <!-- Requirements (collapsible) -->
        <div class="glass-card p-4 space-y-4">
          <button
            type="button"
            (click)="reqOpen.set(!reqOpen())"
            class="flex items-center justify-between w-full cursor-pointer"
          >
            <span class="text-xs font-medium text-slate-400">Requirements</span>
            <svg
              class="w-3.5 h-3.5 text-slate-500 transition-transform"
              [class.rotate-180]="reqOpen()"
              viewBox="0 0 12 12"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6 8.25 1.5 3.75h9L6 8.25Z" />
            </svg>
          </button>

          @if (reqOpen()) {
            <div class="space-y-4 pt-1">
              <!-- Skills chips -->
              <div>
                <label class="block text-xs text-slate-500 mb-1.5">Skills needed</label>
                <div class="flex flex-wrap gap-1.5 mb-2">
                  @for (s of reqSkills(); track s) {
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
                      style="background:rgba(99,102,241,0.15);color:#a5b4fc;border:1px solid rgba(99,102,241,0.3)"
                    >
                      {{ s }}
                      <button
                        type="button"
                        (click)="removeSkill(s)"
                        class="cursor-pointer hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  }
                </div>
                <div class="flex gap-2">
                  <input
                    [(ngModel)]="newSkill"
                    [ngModelOptions]="{ standalone: true }"
                    (keydown.enter)="$event.preventDefault(); addSkill()"
                    type="text"
                    placeholder="e.g. ckm-brand"
                    class="glass-input px-3 py-1.5 text-xs flex-1"
                  />
                  <button type="button" (click)="addSkill()" class="btn-ghost px-3 py-1.5 text-xs">
                    Add
                  </button>
                </div>
              </div>

              <!-- MCP servers -->
              <div>
                <label class="block text-xs text-slate-500 mb-1.5">MCP servers needed</label>
                <div class="flex flex-wrap gap-1.5 mb-2">
                  @for (m of reqMcp(); track m) {
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
                      style="background:rgba(16,185,129,0.15);color:#6ee7b7;border:1px solid rgba(16,185,129,0.3)"
                    >
                      {{ m }}
                      <button
                        type="button"
                        (click)="removeMcp(m)"
                        class="cursor-pointer hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  }
                </div>
                <div class="flex gap-2">
                  <input
                    [(ngModel)]="newMcp"
                    [ngModelOptions]="{ standalone: true }"
                    (keydown.enter)="$event.preventDefault(); addMcp()"
                    type="text"
                    placeholder="e.g. playwright"
                    class="glass-input px-3 py-1.5 text-xs flex-1"
                  />
                  <button type="button" (click)="addMcp()" class="btn-ghost px-3 py-1.5 text-xs">
                    Add
                  </button>
                </div>
              </div>

              <!-- Platforms -->
              <div>
                <label class="block text-xs text-slate-500 mb-1.5">Works best in</label>
                <div class="flex flex-wrap gap-2 mb-2">
                  @for (p of platformOptions; track p) {
                    <button
                      type="button"
                      (click)="togglePlatform(p)"
                      class="px-3 py-1 text-xs rounded-full border transition-all cursor-pointer"
                      [style]="
                        reqPlatforms().includes(p)
                          ? 'background:rgba(245,158,11,0.15);border-color:rgba(245,158,11,0.4);color:#fcd34d'
                          : 'background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.09);color:#64748b'
                      "
                    >
                      {{ p }}
                    </button>
                  }
                  @for (p of customPlatforms(); track p) {
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
                      style="background:rgba(245,158,11,0.15);color:#fcd34d;border:1px solid rgba(245,158,11,0.4)"
                    >
                      {{ p }}
                      <button
                        type="button"
                        (click)="removeCustomPlatform(p)"
                        class="cursor-pointer hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  }
                </div>
                <div class="relative">
                  <input
                    [(ngModel)]="newPlatform"
                    [ngModelOptions]="{ standalone: true }"
                    (input)="onPlatformInput()"
                    (keydown.enter)="$event.preventDefault(); addCustomPlatform()"
                    (keydown.escape)="platformSuggestionsOpen.set(false)"
                    (blur)="onPlatformBlur()"
                    type="text"
                    placeholder="Add another tool…"
                    class="glass-input px-3 py-1.5 text-xs w-full"
                  />
                  @if (platformSuggestionsOpen() && filteredSuggestions().length > 0) {
                    <div
                      class="absolute z-10 w-full mt-1 rounded-lg border overflow-hidden"
                      style="background:rgba(15,15,25,0.95);border-color:rgba(255,255,255,0.1);box-shadow:0 8px 32px rgba(0,0,0,0.4)"
                    >
                      @for (s of filteredSuggestions(); track s) {
                        <button
                          type="button"
                          (mousedown)="$event.preventDefault(); selectSuggestion(s)"
                          class="w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer"
                          style="color:#94a3b8"
                          onmouseover="this.style.background='rgba(245,158,11,0.1)';this.style.color='#fcd34d'"
                          onmouseout="this.style.background='';this.style.color='#94a3b8'"
                        >
                          {{ s }}
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button type="submit" [disabled]="saving()" class="btn-primary px-5 py-2.5 text-sm">
            {{ saving() ? 'Saving…' : isEdit() ? 'Save Changes' : 'Create Prompt' }}
          </button>
          <a
            routerLink="/prompts"
            class="text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors cursor-pointer px-2"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  `,
})
export class PromptEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly platformApi = inject(PlatformApiService);
  readonly promptStore = inject(PromptStore);
  readonly tagStore = inject(TagStore);

  readonly templateHint = '{{variable}}';
  readonly isEdit = signal(false);
  readonly saving = signal(false);
  readonly selectedTags = signal<Set<number>>(new Set());
  readonly visibility = signal<'private' | 'public'>('private');
  readonly reqOpen = signal(false);
  readonly reqSkills = signal<string[]>([]);
  readonly reqMcp = signal<string[]>([]);
  readonly reqPlatforms = signal<string[]>([]);

  newSkill = '';
  newMcp = '';
  newPlatform = '';
  newTag = '';
  newTagColor = '#6366f1';

  readonly platformOptions = ['Claude Code', 'Cursor', 'GitHub Copilot', 'Gemini', 'ChatGPT'];
  private readonly customSuggestionPool = signal<string[]>([]);
  readonly platformSuggestionsOpen = signal(false);
  private readonly newPlatformQuery = signal('');
  readonly tagSuggestionsOpen = signal(false);
  private readonly newTagQuery = signal('');

  readonly customPlatforms = computed(() =>
    this.reqPlatforms().filter((p) => !this.platformOptions.includes(p)),
  );

  readonly filteredSuggestions = computed(() => {
    const q = this.newPlatformQuery().toLowerCase();
    const selected = new Set(this.reqPlatforms());
    return this.customSuggestionPool().filter(
      (s) => !selected.has(s) && (!q || s.toLowerCase().includes(q)),
    );
  });

  readonly filteredTagSuggestions = computed(() => {
    const selected = this.selectedTags();
    return this.tagStore.suggestions().filter((tag) => !selected.has(tag.id));
  });

  readonly selectedUserTags = computed(() => {
    const selected = this.selectedTags();
    const map = this.tagStore.tagMap();
    return [...selected]
      .map((id) => map.get(id))
      .filter((tag): tag is Tag => !!tag && tag.is_system !== 1);
  });

  private promptId: number | null = null;

  readonly form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    content: ['', Validators.required],
  });

  readonly titleInvalid = signal(false);
  readonly contentInvalid = signal(false);

  ngOnInit(): void {
    this.tagStore.load();
    this.tagStore.loadDefaults();
    this.platformApi.getAll().subscribe(({ custom }) => this.customSuggestionPool.set(custom));
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.promptId = Number(id);
      this.promptStore.getById(this.promptId).subscribe((p) => {
        this.form.patchValue({ title: p.title, description: p.description, content: p.content });
        this.selectedTags.set(new Set(p.tag_ids));
        this.visibility.set(p.visibility ?? 'private');
        if (p.requirements) {
          this.reqSkills.set(p.requirements.skills ?? []);
          this.reqMcp.set(p.requirements.mcpServers ?? []);
          this.reqPlatforms.set(p.requirements.platforms ?? []);
          if (
            p.requirements.skills.length ||
            p.requirements.mcpServers.length ||
            p.requirements.platforms.length
          ) {
            this.reqOpen.set(true);
          }
        }
      });
    }
  }

  toggleTag(tagId: number): void {
    this.selectedTags.update((set) => {
      const next = new Set(set);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  onTagInput(): void {
    this.newTagQuery.set(this.newTag);
    this.tagSuggestionsOpen.set(true);
    this.tagStore.suggest(this.newTag, 20);
  }

  onTagBlur(): void {
    this.tagSuggestionsOpen.set(false);
  }

  selectTagSuggestion(tag: Tag): void {
    this.selectedTags.update((set) => new Set([...set, tag.id]));
    this.resetTagInput();
  }

  addNewTag(): void {
    const name = this.newTag.trim();
    if (!name) {
      this.resetTagInput();
      return;
    }
    const existing = this.tagStore
      .tags()
      .find((tag) => tag.name.trim().toLowerCase() === name.toLowerCase());
    if (existing) {
      this.selectedTags.update((set) => new Set([...set, existing.id]));
      this.resetTagInput();
      return;
    }
    this.tagStore.create({ name, color: this.newTagColor }, (created) => {
      this.selectedTags.update((set) => new Set([...set, created.id]));
    });
    this.newTagColor = '#6366f1';
    this.resetTagInput();
  }

  private resetTagInput(): void {
    this.newTag = '';
    this.newTagQuery.set('');
    this.tagSuggestionsOpen.set(false);
    this.tagStore.clearSuggestions();
  }

  addSkill(): void {
    const s = this.newSkill.trim();
    if (s && !this.reqSkills().includes(s)) this.reqSkills.update((arr) => [...arr, s]);
    this.newSkill = '';
  }

  removeSkill(s: string): void {
    this.reqSkills.update((arr) => arr.filter((x) => x !== s));
  }

  addMcp(): void {
    const m = this.newMcp.trim();
    if (m && !this.reqMcp().includes(m)) this.reqMcp.update((arr) => [...arr, m]);
    this.newMcp = '';
  }

  removeMcp(m: string): void {
    this.reqMcp.update((arr) => arr.filter((x) => x !== m));
  }

  togglePlatform(p: string): void {
    this.reqPlatforms.update((arr) => (arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]));
  }

  onPlatformInput(): void {
    this.newPlatformQuery.set(this.newPlatform);
    this.platformSuggestionsOpen.set(true);
  }

  onPlatformBlur(): void {
    this.platformSuggestionsOpen.set(false);
  }

  selectSuggestion(name: string): void {
    this.reqPlatforms.update((arr) => (arr.includes(name) ? arr : [...arr, name]));
    this.newPlatform = '';
    this.newPlatformQuery.set('');
    this.platformSuggestionsOpen.set(false);
  }

  addCustomPlatform(): void {
    const name = this.newPlatform.trim();
    if (!name || this.reqPlatforms().includes(name)) {
      this.newPlatform = '';
      this.newPlatformQuery.set('');
      this.platformSuggestionsOpen.set(false);
      return;
    }
    this.reqPlatforms.update((arr) => [...arr, name]);
    if (!this.platformOptions.some((p) => p.toLowerCase() === name.toLowerCase())) {
      this.platformApi.addCustom(name).subscribe(({ ok }) => {
        if (ok && !this.customSuggestionPool().includes(name)) {
          this.customSuggestionPool.update((arr) => [...arr, name].sort());
        }
      });
    }
    this.newPlatform = '';
    this.newPlatformQuery.set('');
    this.platformSuggestionsOpen.set(false);
  }

  removeCustomPlatform(name: string): void {
    this.reqPlatforms.update((arr) => arr.filter((x) => x !== name));
  }

  private buildRequirements(): PromptRequirements | undefined {
    const s = this.reqSkills(),
      m = this.reqMcp(),
      p = this.reqPlatforms();
    if (!s.length && !m.length && !p.length) return undefined;
    return { skills: s, mcpServers: m, platforms: p };
  }

  submit(): void {
    this.titleInvalid.set(false);
    this.contentInvalid.set(false);
    if (this.form.invalid) {
      this.titleInvalid.set(!!this.form.controls.title.errors);
      this.contentInvalid.set(!!this.form.controls.content.errors);
      return;
    }
    this.saving.set(true);
    const dto = {
      title: this.form.value.title!,
      content: this.form.value.content!,
      description: this.form.value.description ?? '',
      tagIds: [...this.selectedTags()],
      visibility: this.visibility(),
      requirements: this.buildRequirements(),
    };
    const obs = this.isEdit()
      ? this.promptStore.update(this.promptId!, dto)
      : this.promptStore.create(dto);
    obs.subscribe({
      next: (p) => this.router.navigate(['/prompts', p.id]),
      error: () => this.saving.set(false),
    });
  }
}
