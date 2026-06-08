import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../state/auth.store';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  if (auth.isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/']);
};
