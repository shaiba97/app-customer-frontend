import { Component, signal, computed, inject, OnInit, AfterViewInit, ElementRef, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { LucideBus, LucideMapPin, LucideSearch, LucidePencil, LucideX, LucideArrowUp, LucideArrowDown, LucideChevronLeft, LucideChevronRight, LucideHand, LucideAward, LucideFileText, LucideArmchair, LucideWallet } from '@lucide/angular';
import { TripSearchService } from '../../services/trip-search/trip-search.service';
import { MobileTripCardComponent } from '../../shared/mobile-trip-card';
import { CitySelectComponent } from '../../shared/city-select/city-select';
import { AuthStoreService } from '../../services/auth-store/auth-store.service';
import { CitiesService } from '../../services/cities/cities.service';
import { JsonLdService } from '../../services/json-ld/json-ld.service';
import { currentPath, pageGraph, tripItemList } from '../../services/json-ld/json-ld';

interface HeroSlide {
  title: string;
  subtitle: string;
  from: string;
  to: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgClass, NgOptimizedImage, LucideBus, LucideMapPin, LucideSearch, LucidePencil, LucideX, LucideArrowUp, LucideArrowDown, LucideChevronLeft, LucideChevronRight, LucideHand, LucideAward, LucideFileText, LucideArmchair, LucideWallet, MobileTripCardComponent, CitySelectComponent],
  templateUrl: './home.html',
})
export class Home implements OnInit, AfterViewInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tripSvc = inject(TripSearchService);
  private citiesSvc = inject(CitiesService);
  private authStore = inject(AuthStoreService);
  private hostElement = inject(ElementRef<HTMLElement>);
  private destroyRef = inject(DestroyRef);
  private jsonLd = inject(JsonLdService);

  from = signal<string>('');
  to = signal<string>('');
  date = signal<string>('');
  cities = signal<string[]>([]);
  today = new Date().toISOString().split('T')[0];
  error = signal<string>('');
  featuredTrips = signal<any[]>([]);
  isLoadingTrips = signal<boolean>(false);
  showAllTrips = signal<boolean>(false);
  visibleTrips = computed(() => this.showAllTrips() ? this.featuredTrips() : this.featuredTrips().slice(0, 3));

  currentMonth = signal<string>(this.today.slice(0, 7));
  scrollY = signal<number>(0);
  showSearchModal = signal<boolean>(false);

  heroSlides: readonly HeroSlide[] = [
    { title: 'رحلاتك بين المدن أسهل من أي وقت', subtitle: 'احجز مقعدك في أقل من دقيقة', from: '#0D9488', to: '#134E4A' },
    { title: 'وفّر أكثر مع عروض التفيّة', subtitle: 'خصومات موسمية على أشهر المسارات', from: '#0F766E', to: '#0D9488' },
    { title: 'رحلة مؤمّنة… راحة بال', subtitle: 'استرداد فوري عند الإلغاء', from: '#115E59', to: '#0F766E' },
  ];
  heroPage = signal<number>(0);
  heroPaused = signal<boolean>(false);
  private touchX = 0;

  swapped = signal<boolean>(false);

  welcomeText = computed(() => {
    const name = this.authStore.customerName()?.trim();
    return name ? `أهلاً ${name} في تفيّة` : 'أهلاً بك في تفيّة';
  });

  showCompactSearchBar = computed(() => this.scrollY() > 280);

  compactSearchRouteLabel = computed(() => {
    const f = this.from();
    const t = this.to();
    if (f && t) return `${f} ← ${t}`;
    if (f) return f;
    return 'ابحث عن رحلة';
  });

  compactSearchDateLabel = computed(() => {
    if (!this.date()) return '';
    return new Date(this.date()).toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'long' });
  });

  routeLabel = computed(() => {
    const f = this.from();
    const t = this.to();
    if (f && t) return `${f} ← ${t}`;
    if (f) return f;
    return 'ابحث عن رحلة';
  });

  monthLabel = computed(() => {
    const [y, m] = this.currentMonth().split('-').map(Number);
    return new Date(y, m - 1).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
  });

  datePills = computed(() => {
    const [y, m] = this.currentMonth().split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const pills = [];
    const todayStr = this.today;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(y, m - 1, d);
      const value = dateObj.toISOString().split('T')[0];
      if (value < todayStr) continue;
      pills.push({ value, day: dateObj.toLocaleDateString('ar-SA', { weekday: 'short' }), num: this.toArabicNumeral(d), isToday: value === this.today });
    }
    return pills;
  });

  canGoPrev = computed(() => this.currentMonth() > this.today.slice(0, 7));
  selectedDate = computed(() => this.date() || this.today);

  private toArabicNumeral(n: number): string {
    return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
  }

  ngOnInit(): void {
    this.jsonLd.set('page', pageGraph('الرئيسية', currentPath(this.router.url), [{ name: 'الرئيسية' }]));
    this.citiesSvc.getAllCities().subscribe({ next: data => this.cities.set(data), error: () => {} });
    this.isLoadingTrips.set(true);
    this.tripSvc.getAllTrips().subscribe({
      next: r => {
        this.featuredTrips.set(r.data ?? []);
        const list = tripItemList(this.featuredTrips(), 'الرحلات المتاحة', currentPath(this.router.url));
        if (list) this.jsonLd.set('trips', list);
        this.isLoadingTrips.set(false);
      },
      error: () => this.isLoadingTrips.set(false),
    });
    this.date.set(this.today);
  }

  ngAfterViewInit(): void {
    const el = this.hostElement.nativeElement.closest('.overflow-y-auto') as HTMLElement | null;
    if (el) {
      const handler = () => this.scrollY.set(el.scrollTop);
      el.addEventListener('scroll', handler, { passive: true });
      this.destroyRef.onDestroy(() => el.removeEventListener('scroll', handler));
    }
  }

  toggleTripsVisibility(): void { this.showAllTrips.update(v => !v); }

  setHeroPage(i: number): void { this.heroPage.set(i % this.heroSlides.length); }
  nextHero(): void { this.setHeroPage(this.heroPage() + 1); }
  prevHero(): void { this.setHeroPage((this.heroPage() - 1 + this.heroSlides.length) % this.heroSlides.length); }

  onTouchStart(e: TouchEvent): void { this.touchX = e.touches[0]?.clientX ?? 0; }
  onTouchEnd(e: TouchEvent): void {
    const dx = (e.changedTouches[0]?.clientX ?? this.touchX) - this.touchX;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) this.nextHero(); else this.prevHero();
  }

  swap(): void { const t = this.from(); this.from.set(this.to()); this.to.set(t); this.swapped.set(!this.swapped()); }
  selectDate(val: string): void { this.date.set(val); }
  prevMonth(): void {
    const [y, m] = this.currentMonth().split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    this.currentMonth.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  nextMonth(): void {
    const [y, m] = this.currentMonth().split('-').map(Number);
    const d = new Date(y, m, 1);
    this.currentMonth.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  goToSeat(trip: any): void { if (trip?.id) this.router.navigate(['../seat', trip.id], { relativeTo: this.route, state: { trip } }); }

  onSearch(): void {
    if (!this.from() || !this.to() || !this.date()) { this.error.set('يرجى تعبئة جميع الحقول'); return; }
    this.error.set('');
    this.router.navigate(['../results'], { relativeTo: this.route, queryParams: { from: this.from(), to: this.to(), date: this.date() } });
  }

  openSearchModal(): void { this.showSearchModal.set(true); }
  closeSearchModal(): void { this.showSearchModal.set(false); }

  onSearchFromModal(): void {
    this.closeSearchModal();
    setTimeout(() => this.onSearch(), 150);
  }
}