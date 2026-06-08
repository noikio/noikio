import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div>
      <!-- ── HERO ─────────────────────────────────────────── -->
      <section class="text-center py-24 px-4">
        <div class="flex flex-wrap items-center justify-center gap-3 mb-8 lp-fade-up lp-d1">
          <div
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);color:#a5b4fc"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block"></span>
            Now with Chain workflows or maybe not
          </div>
          <a
            href="https://github.com/noikio/noikio"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:border-slate-500"
            style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#94a3b8"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            Open source on GitHub
          </a>
        </div>

        <h1
          class="text-5xl sm:text-6xl font-bold leading-[1.1] mb-6 lp-fade-up lp-d2"
          style="letter-spacing:-0.02em"
        >
          The prompt manager<br />
          <span class="gradient-text">nobody asked for.</span>
        </h1>

        <p class="text-lg text-slate-400 max-w-xl mx-auto mb-4 leading-relaxed lp-fade-up lp-d3">
          Store, search, template, and chain your AI prompts. Full-text search. Version history. Tag
          system. Multi-step workflows.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4 mb-14 lp-fade-up lp-d4">
          <a routerLink="/discover" class="btn-primary px-8 py-3 text-base font-semibold">
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path
                d="M3 2.69a.75.75 0 0 1 1.088-.67l6.5 3.81a.75.75 0 0 1 0 1.34l-6.5 3.81A.75.75 0 0 1 3 10.31V2.69Z"
              />
            </svg>
            Open the app — it's free
          </a>
          <a href="#features" class="btn-ghost px-8 py-3 text-base"> See what's inside ↓ </a>
        </div>

        <!-- Stats -->
        <div class="flex flex-wrap items-center justify-center gap-10 lp-fade-up lp-d5">
          @for (stat of stats; track stat.label) {
            <div class="text-center">
              <div
                class="text-3xl font-bold gradient-text mb-0.5"
                style="font-family:'Space Grotesk',sans-serif"
              >
                {{ stat.value }}
              </div>
              <div class="text-xs text-slate-500">{{ stat.label }}</div>
            </div>
          }
        </div>
      </section>

      <!-- ── MARQUEE ────────────────────────────────────────── -->
      <div
        class="py-6 mb-4"
        style="border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05)"
      >
        <p class="text-center text-xs text-slate-700 uppercase tracking-[0.2em] mb-5">As seen in</p>
        <div class="marquee-container">
          <div class="marquee-track">
            @for (logo of marqueeLogos; track $index) {
              <span class="text-slate-600 font-semibold text-sm">{{ logo }}</span>
            }
          </div>
        </div>
      </div>

      <!-- ── FEATURES ──────────────────────────────────────── -->
      <section id="features" class="py-20">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-100 mb-3">
            Everything you need.<br />
            <span class="text-slate-500 font-normal text-2xl">Nothing you don't.</span>
          </h2>
          <p class="text-slate-500 text-sm">
            (Seriously. It's just prompts. But a very good prompt manager.)
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (f of features; track f.title) {
            <div class="glass-card p-6">
              <div class="feature-icon">
                <svg
                  class="w-5 h-5 text-indigo-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  [innerHTML]="safeIcon(f.icon)"
                ></svg>
              </div>
              <h3 class="text-base font-semibold text-slate-100 mb-2">{{ f.title }}</h3>
              <p class="text-sm text-slate-400 leading-relaxed">{{ f.desc }}</p>
            </div>
          }
        </div>
      </section>

      <!-- ── HOW IT WORKS ──────────────────────────────────── -->
      <section class="py-16">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-slate-100 mb-2">Dead simple.</h2>
          <p class="text-slate-500 text-sm">Three steps. No tutorial needed.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          @for (step of steps; track step.n) {
            <div class="text-center px-4">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold"
                style="background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2));border:1px solid rgba(99,102,241,0.3);color:#a5b4fc;font-family:'Space Grotesk',sans-serif"
              >
                {{ step.n }}
              </div>
              <h3 class="text-sm font-semibold text-slate-200 mb-1">{{ step.title }}</h3>
              <p class="text-xs text-slate-500 leading-relaxed">{{ step.desc }}</p>
            </div>
          }
        </div>
      </section>

      <!-- ── TESTIMONIALS ──────────────────────────────────── -->
      <section class="py-16">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-slate-100 mb-2">Don't take our word for it.</h2>
          <p class="text-slate-500 text-sm">
            Real quotes. From real people. Who may or may not be real.
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (t of testimonials; track t.name) {
            <div class="glass-card p-6 flex flex-col gap-4">
              <div class="flex gap-1">
                @for (s of [1, 2, 3, 4, 5]; track s) {
                  <svg
                    class="w-3.5 h-3.5 text-amber-400"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 1.5l1.8 3.6 4 .6-2.9 2.8.7 4L8 10.4l-3.6 1.9.7-4L2.2 5.7l4-.6z" />
                  </svg>
                }
              </div>
              <p class="text-sm text-slate-300 leading-relaxed flex-1 italic">"{{ t.quote }}"</p>
              <div>
                <p class="text-sm font-semibold text-slate-200">{{ t.name }}</p>
                <p class="text-xs text-slate-500">{{ t.role }}</p>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- ── BY THE NUMBERS ──────────────────────────────────── -->
      <section class="py-16">
        <div class="glass-card p-10 max-w-3xl mx-auto text-center">
          <div class="mb-10">
            <h2 class="text-3xl font-bold text-slate-100 mb-2">By the Numbers</h2>
            <p class="text-slate-500 text-sm">
              We track everything. The numbers are just… small right now.
            </p>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            @for (s of vanityStats; track s.label) {
              <div class="text-center">
                <div
                  class="text-4xl sm:text-5xl font-bold gradient-text mb-1"
                  style="font-family:'Space Grotesk',sans-serif"
                >
                  {{ s.value }}
                </div>
                <div class="text-sm font-semibold text-slate-300 mb-0.5">{{ s.label }}</div>
                <div class="text-xs text-slate-500 italic">{{ s.note }}</div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ── FINAL CTA ─────────────────────────────────────── -->
      <section class="py-20 text-center">
        <div
          class="glass-card p-12 max-w-2xl mx-auto"
          style="background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.06))"
        >
          <h2 class="text-3xl sm:text-4xl font-bold text-slate-100 mb-4">
            The app is live.<br />
            <span class="text-slate-500 font-normal text-2xl">Nobody asked. We built it anyway.</span>
          </h2>
          <p class="text-slate-400 mb-8 leading-relaxed">
            Zero subscriptions. Zero paywalls. One developer with too much free time.<br />
            <span class="text-slate-300"
              >This is your chance to use something probably fine.</span
            >
          </p>
          <div class="flex flex-wrap items-center justify-center gap-4">
            <a routerLink="/discover" class="btn-primary px-8 py-3 text-base font-semibold">
              <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path
                  d="M3 2.69a.75.75 0 0 1 1.088-.67l6.5 3.81a.75.75 0 0 1 0 1.34l-6.5 3.81A.75.75 0 0 1 3 10.31V2.69Z"
                />
              </svg>
              Open the app — it's free
            </a>
          </div>
          <p class="text-xs text-slate-600 mt-5">
            No credit card. No email. No dark patterns. Just prompts.
          </p>
        </div>
      </section>

      <!-- ── FOOTER ─────────────────────────────────────────── -->
      <footer class="text-center py-10 border-t" style="border-color:rgba(255,255,255,0.05)">
        <div class="flex items-center justify-center gap-2 mb-3">
          <svg
            class="w-4 h-4 text-indigo-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M11.983 1.907a.75.75 0 0 0-1.292-.657l-8.5 9.5A.75.75 0 0 0 2.75 12h6.572l-1.305 6.093a.75.75 0 0 0 1.292.657l8.5-9.5A.75.75 0 0 0 17.25 8h-6.572l1.305-6.093Z"
            />
          </svg>
          <span class="text-sm font-semibold gradient-text">noikio</span>
        </div>
        <p class="text-xs text-slate-600">
          Built for fun. Runs locally and not only. Costs nothing.<br />
          © {{ year }} · noikio ·
          <a
            href="https://github.com/noikio/noikio"
            target="_blank"
            rel="noopener noreferrer"
            class="text-slate-500 hover:text-slate-400 transition-colors"
          >Open source on GitHub</a>
        </p>
      </footer>
    </div>
  `,
})
export class LandingComponent {
  private readonly sanitizer = inject(DomSanitizer);
  readonly year = new Date().getFullYear();

  safeIcon(path: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(path);
  }

  readonly vanityStats = [
    { value: '0', label: 'Active Users', note: 'and counting. carefully.' },
    { value: '$0', label: 'Total Revenue', note: 'pre-money valuation: $∞' },
    { value: '∞', label: 'Potential', note: 'totally real metric' },
    { value: '100%', label: 'Uptime', note: 'nothing to crash if no one logs in' },
  ];

  readonly stats = [
    { value: '∞', label: 'Prompts you can store' },
    { value: 'Free', label: 'Forever. No catch.' },
    { value: '100%', label: 'Runs locally' },
    { value: '0', label: 'Tracking & analytics' },
  ];

  readonly marqueeLogos = [
    'Product Hunt',
    'Hacker News',
    'r/ChatGPT',
    'My Notes App (previously)',
    'Some Discord Server',
    "Mom's Email",
    'The Void',
    'This README',
    'Product Hunt',
    'Hacker News',
    'r/ChatGPT',
    'My Notes App (previously)',
    'Some Discord Server',
    "Mom's Email",
    'The Void',
    'This README',
  ];

  readonly features = [
    {
      title: 'Instant Full-Text Search',
      desc: 'SQLite FTS5 powers lightning-fast search across all your prompts. Find anything in milliseconds. Even that prompt you wrote 6 months ago.',
      icon: '<path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clip-rule="evenodd"/>',
    },
    {
      title: 'Template Variables',
      desc: 'Write prompts with {{placeholders}} that transform into interactive forms. Fill in the blanks, copy, done. Your prompts become reusable tools.',
      icon: '<path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.24a1 1 0 0 0 0 1.962l1.192.24a1 1 0 0 1 .785.785l.24 1.192a1 1 0 0 0 1.962 0l.24-1.192a1 1 0 0 1 .785-.785l1.192-.24a1 1 0 0 0 0-1.962l-1.192-.24a1 1 0 0 1-.785-.785l-.24-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684Z"/>',
    },
    {
      title: 'Auto Version History',
      desc: 'Every edit is automatically saved as a version. Roll back to any previous version with one click. Your prompt evolution, preserved forever.',
      icon: '<path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd"/>',
    },
    {
      title: 'Tag Everything',
      desc: 'Color-coded tags keep your library organized. Filter by context, model, project, or whatever system makes sense to you.',
      icon: '<path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-3a1 1 0 0 0-.867.5 1 1 0 1 1-1.731-1A3 3 0 0 1 13 8a3.001 3.001 0 0 1-2 2.83V11a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1 1 1 0 0 0 0-2Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/>',
    },
    {
      title: 'Prompt Chains',
      desc: 'Link prompts into multi-step workflows. Walk through them one by one, forwarding outputs as inputs to the next step. Think pipelines, but for prompts.',
      icon: '<path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H5.498a.75.75 0 0 0-.75.75v3.219a.75.75 0 0 0 1.5 0v-2.082l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.26-3.673a.75.75 0 0 0 .219-.53V3.782a.75.75 0 0 0-1.5 0v2.082l-.31-.31A7 7 0 0 0 3.27 8.68a.75.75 0 0 0 1.449.394 5.5 5.5 0 0 1 9.032-2.203l.312.311H11.63a.75.75 0 1 0 0 1.5h3.434a.75.75 0 0 0 .53-.219Z" clip-rule="evenodd"/>',
    },
    {
      title: 'Runs Locally',
      desc: 'SQLite database on your machine. No cloud. No subscription. No data leaving your computer. Your prompts are yours, forever.',
      icon: '<path fill-rule="evenodd" d="M12.395 2.553a1 1 0 0 0-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 0 0-.613 3.58 2.64 2.64 0 0 1-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 0 0 7.346 3.19c-.684.663-1.258 1.43-1.74 2.249A11.85 11.85 0 0 0 4 10a7 7 0 1 0 14 0c0-1.458-.4-2.83-1.076-4.015-1.022 1.7-2.14 2.938-3.529 3.568Z" clip-rule="evenodd"/>',
    },
  ];

  readonly steps = [
    {
      n: '1',
      title: 'Write your prompt',
      desc: 'Add a title, content, and optional description. Use {{variables}} to make it reusable.',
    },
    {
      n: '2',
      title: 'Tag and organize',
      desc: 'Add color-coded tags. Build a library that makes sense to you.',
    },
    {
      n: '3',
      title: 'Use it anywhere',
      desc: 'Search, fill in variables, copy with one click. Ready for GPT, Claude, Gemini, anything.',
    },
  ];

  readonly testimonials = [
    {
      quote:
        'I saved literally 4 minutes last week because I could find my system prompt instantly. ROI: infinite.',
      name: 'Alex P.',
      role: 'Prompt Engineer, Probably',
    },
    {
      quote:
        "My boss thinks I'm more productive. I just have better prompts and can actually find them.",
      name: 'Sam K.',
      role: 'Senior Developer',
    },
    {
      quote:
        "I kept waiting for the paywall. It never came. I'm still waiting. It's still free. I don't trust it.",
      name: 'Taylor M.',
      role: 'Professional Skeptic',
    },
  ];

}
