import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { NgClass } from '@angular/common';
import { filter } from 'rxjs/operators';
import {
  LucideBus,
  LucideSun,
  LucideMoon,
  LucideUserRound,
  LucideChevronDown,
  LucideCalendarCheck,
  LucideSettings,
  LucideLogOut,
  LucideLogIn,
  LucideUserPlus,
  LucideHome,
  LucideCalendarClock,
  LucideUser,
} from '@lucide/angular';
import { ThemeService } from '../../core/services/theme.service';
import { AuthStoreService } from '../../services/auth-store/auth-store.service';

@Component({
  selector: 'app-web-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    NgClass,
    LucideBus,
    LucideSun,
    LucideMoon,
    LucideUserRound,
    LucideChevronDown,
    LucideCalendarCheck,
    LucideSettings,
    LucideLogOut,
    LucideLogIn,
    LucideUserPlus,
    LucideHome,
    LucideCalendarClock,
    LucideUser,
  ],
  templateUrl: './webshell.html',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class WebShell {
  themeService = inject(ThemeService);
  authStore = inject(AuthStoreService);
  private router = inject(Router);

  showUserMenu = signal<boolean>(false);
  showMobileMenu = signal<boolean>(false);

  currentUrl = signal<string>(this.router.url);

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.currentUrl.set((e as NavigationEnd).urlAfterRedirects);
    });
  }

  isLoggedIn = computed(() => this.authStore.isLoggedIn());
  userName = computed(() => this.authStore.customerName() || 'المستخدم');

  isHomeActive = computed(() => {
    const url = this.currentUrl();
    return url === '/home' || url === '/' || url.startsWith('/search-results');
  });
  isBookingsActive = computed(() => {
    const url = this.currentUrl();
    return url.startsWith('/bookings') || url.startsWith('/booking');
  });
  isProfileActive = computed(() => {
    const url = this.currentUrl();
    return url.startsWith('/profile') || url.startsWith('/login') || url.startsWith('/register');
  });

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
  }

  toggleMobileMenu(): void {
    this.showMobileMenu.update(v => !v);
  }

  logout(): void {
    this.showUserMenu.set(false);
    this.showMobileMenu.set(false);
    this.authStore.logout();
  }

  onDocumentClick(e: MouseEvent): void {
    const t = e.target as HTMLElement;
    if (!t.closest('[data-user-menu]')) {
      this.showUserMenu.set(false);
    }
  }
}
