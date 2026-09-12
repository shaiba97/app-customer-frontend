import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStoreService } from '../../services/auth-store/auth-store.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthStoreService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  const isMobile = state.url.startsWith('/m');
  return router.createUrlTree([isMobile ? '/m/login' : '/login']);
};
