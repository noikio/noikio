import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';
import { adminGuard } from '../core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('../features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'auth/login',
    loadComponent: () => import('../features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'prompts',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../features/prompt-list/prompt-list.component').then((m) => m.PromptListComponent),
  },
  {
    path: 'prompts/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../features/prompt-editor/prompt-editor.component').then(
        (m) => m.PromptEditorComponent,
      ),
  },
  {
    path: 'prompts/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../features/prompt-editor/prompt-editor.component').then(
        (m) => m.PromptEditorComponent,
      ),
  },
  {
    path: 'prompts/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../features/prompt-detail/prompt-detail.component').then(
        (m) => m.PromptDetailComponent,
      ),
  },
  {
    path: 'chains',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../features/chain-editor/chain-list.component').then((m) => m.ChainListComponent),
  },
  {
    path: 'chains/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../features/chain-editor/chain-editor.component').then((m) => m.ChainEditorComponent),
  },
  {
    path: 'chains/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../features/chain-editor/chain-editor.component').then((m) => m.ChainEditorComponent),
  },
  {
    path: 'chains/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../features/chain-editor/chain-detail.component').then((m) => m.ChainDetailComponent),
  },
  {
    path: 'discover',
    loadComponent: () =>
      import('../features/discover/discover.component').then((m) => m.DiscoverComponent),
  },
  {
    path: 'discover/:id',
    loadComponent: () =>
      import('../features/discover/discover-detail.component').then(
        (m) => m.DiscoverDetailComponent,
      ),
  },
  {
    path: 'leaderboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../features/leaderboard/leaderboard.component').then((m) => m.LeaderboardComponent),
  },
  {
    path: 'users/:username',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../features/profile/user-profile.component').then((m) => m.UserProfileComponent),
  },
  {
    path: 'feed',
    loadComponent: () =>
      import('../features/feed/feed.component').then((m) => m.FeedComponent),
  },
  { path: 'bookmarks', redirectTo: '/prompts', pathMatch: 'full' },
  { path: 'trending', redirectTo: '/feed', pathMatch: 'full' },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('../features/admin/admin.component').then((m) => m.AdminComponent),
  },
  { path: '**', redirectTo: '' },
];
