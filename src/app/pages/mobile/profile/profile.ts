import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStoreService } from '../../../services/auth-store/auth-store.service';
import { JsonLdService } from '../../../services/json-ld/json-ld.service';
import { currentPath, pageGraph } from '../../../services/json-ld/json-ld';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private router = inject(Router);
  authStore = inject(AuthStoreService);
  private jsonLd = inject(JsonLdService);

  isLoggedIn = computed(() => this.authStore.isLoggedIn());
  customerName = computed(() => this.authStore.customerName());
  customerPhone = computed(() => this.authStore.customerPhone());
  customerEmail = computed(() => this.authStore.customerEmail());
  initials = computed(() => {
    const n = this.customerName().trim();
    if (!n) return '؟';
    return n.split(/\s+/).slice(0, 2).map(w => w.charAt(0)).join('');
  });

  showConfirmLogout = signal(false);
  notice = signal('');

  ngOnInit(): void {
    this.jsonLd.set('page', pageGraph('حسابي', currentPath(this.router.url), [{ name: 'حسابي' }]));
  }

  login(): void { this.router.navigate(['/m/login']); }

  openLogoutConfirm(): void { this.showConfirmLogout.set(true); }
  cancelLogout(): void { this.showConfirmLogout.set(false); }
  confirmLogout(): void { this.showConfirmLogout.set(false); this.authStore.logout(); }

  helpComingSoon(): void {
    this.notice.set('قريباً');
    setTimeout(() => this.notice.set(''), 2200);
  }

  goToEditProfile(): void { this.router.navigate(['/m/profile/edit']); }
  goToBookings(): void { this.router.navigate(['/m/bookings']); }
  goToAwards(): void { this.router.navigate(['/m/profile/awards']); }
}