import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../state/auth.store';

const ADMIN_EMAIL = 'admin@noikio.com';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const user = auth.currentUser();
  if (user?.email === ADMIN_EMAIL) return true;
  return inject(Router).createUrlTree(['/']);
};
