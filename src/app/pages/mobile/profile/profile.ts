import { Component, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStoreService } from '../../../services/auth-store/auth-store.service';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
})
export class Profile {
  private router = inject(Router);
  authStore = inject(AuthStoreService);

  isLoggedIn = computed(() => this.authStore.isLoggedIn());
  customerName = computed(() => this.authStore.customerName());

  isDeleting = signal(false);
  showConfirmDelete = signal(false);
  deleteError = signal('');

  login(): void { this.router.navigate(['/login']); }
  logout(): void { this.authStore.logout(); }

  openDeleteConfirm(): void { this.showConfirmDelete.set(true); this.deleteError.set(''); }
  cancelDelete(): void { this.showConfirmDelete.set(false); this.deleteError.set(''); }

  confirmDelete(): void {
    this.isDeleting.set(true);
    this.deleteError.set('');
    this.authStore.deleteAccount().subscribe({
      next: () => { this.authStore.logout(); this.isDeleting.set(false); this.showConfirmDelete.set(false); this.router.navigate(['/home']); },
      error: (err: any) => { this.isDeleting.set(false); this.deleteError.set(err?.error?.message ?? 'فشل حذف الحساب'); },
    });
  }

  private p = (path: string) => this.router.url.startsWith('/m/') ? `/m${path}` : path;

  goToAwards(): void { this.router.navigate([this.p('/profile/awards')]); }
  goToSettings(): void { this.router.navigate([this.p('/profile/settings')]); }
}
