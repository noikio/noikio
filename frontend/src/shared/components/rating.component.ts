import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { PromptApiService } from '../../core/api/prompt-api.service';

@Component({
  selector: 'app-rating',
  standalone: true,
  template: `
    <div class="flex items-center gap-2">
      <button
        (click)="vote('like')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer"
        [style]="userRating() === 'like'
          ? 'background:rgba(16,185,129,0.2);border-color:rgba(16,185,129,0.5);color:#6ee7b7;box-shadow:0 0 12px rgba(16,185,129,0.25)'
          : 'background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.09);color:#64748b'"
        aria-label="Like"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M1 8.25a1.25 1.25 0 1 1 2.5 0v7.5a1.25 1.25 0 0 1-2.5 0v-7.5ZM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0 1 14 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 0 1-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 0 1-1.341-.317l-2.734-1.366A3 3 0 0 0 6.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 0 1 2.166-1.73c.432-.143.853-.386 1.011-.76A2.8 2.8 0 0 0 11 3Z"/>
        </svg>
        {{ likes() }}
      </button>
      <button
        (click)="vote('dislike')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer"
        [style]="userRating() === 'dislike'
          ? 'background:rgba(239,68,68,0.2);border-color:rgba(239,68,68,0.5);color:#fca5a5;box-shadow:0 0 12px rgba(239,68,68,0.25)'
          : 'background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.09);color:#64748b'"
        aria-label="Dislike"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M18.905 12.75a1.25 1.25 0 0 1-2.5 0v-7.5a1.25 1.25 0 0 1 2.5 0v7.5ZM8.905 17v1.3c0 .268-.14.526-.395.607A2 2 0 0 1 5.905 17c0-.995.182-1.948.514-2.826.204-.54-.166-1.174-.744-1.174h-2.52c-1.243 0-2.261-1.01-2.146-2.247.193-2.08.652-4.082 1.341-5.974C2.752 3.678 3.833 3 5.005 3h3.192a3 3 0 0 1 1.341.317l2.734 1.366A3 3 0 0 0 13.613 5h1.292v7h-.963c-.685 0-1.258.483-1.612 1.068a4.011 4.011 0 0 1-2.166 1.73c-.432.143-.853.386-1.011.76a2.8 2.8 0 0 0-.24 1.142Z"/>
        </svg>
        {{ dislikes() }}
      </button>
    </div>
  `,
})
export class RatingComponent implements OnInit {
  private readonly api = inject(PromptApiService);

  readonly promptId = input.required<number>();
  readonly likes = input.required<number>();
  readonly dislikes = input.required<number>();
  readonly initialRating = input<'like' | 'dislike' | null>(null);

  readonly ratingChange = output<{ likes: number; dislikes: number; userRating: 'like' | 'dislike' | null }>();

  readonly userRating = signal<'like' | 'dislike' | null>(null);

  ngOnInit(): void {
    this.userRating.set(this.initialRating());
  }

  vote(rating: 'like' | 'dislike'): void {
    const current = this.userRating();
    if (current === rating) {
      this.api.unrate(this.promptId()).subscribe(() => {
        this.userRating.set(null);
        this.ratingChange.emit({ likes: this.likes(), dislikes: this.dislikes(), userRating: null });
      });
    } else {
      this.api.rate(this.promptId(), rating).subscribe(() => {
        this.userRating.set(rating);
        this.ratingChange.emit({ likes: this.likes(), dislikes: this.dislikes(), userRating: rating });
      });
    }
  }
}
