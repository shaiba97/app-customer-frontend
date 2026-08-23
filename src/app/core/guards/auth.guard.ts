import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStoreService } from '../../services/auth-store/auth-store.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStoreService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/login']);
};
