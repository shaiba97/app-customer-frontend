import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { LucideArrowRight, LucideArmchair, LucideLogIn, LucideInfo, LucideX, LucideBus } from '@lucide/angular';
import { BookingService } from '../../services/booking/booking.service';
import { SessionService } from '../../services/session/session.service';
import { TimeFormatPipe } from '../../pipes/time-format/time-format-pipe';
import { ArabicNumberPipe } from '../../pipes/arabic-number/arabic-number-pipe';
import { WsService } from '../../services/ws.service';
import { AuthStoreService } from '../../services/auth-store/auth-store.service';
import { JsonLdService } from '../../services/json-ld/json-ld.service';
import { busTrip, currentPath, pageGraph } from '../../services/json-ld/json-ld';

type SeatStatus = 'available' | 'selected' | 'booked';
interface Seat { number: number; status: SeatStatus; }

@Component({
  selector: 'app-select-seat',
  standalone: true,
  imports: [DatePipe, TimeFormatPipe, ArabicNumberPipe, LucideArrowRight, LucideArmchair, LucideLogIn, LucideInfo, LucideX, LucideBus],
  templateUrl: './select-seat.html',
})
export class SelectSeat implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookingSvc = inject(BookingService);
  private sessionSvc = inject(SessionService);
  private ws = inject(WsService);
  private authStore = inject(AuthStoreService);
  private jsonLd = inject(JsonLdService);

  private _tripId = '';
  private wsCleanups: (() => void)[] = [];
  private onPop = (): void => { this.sessionSvc.exit(this._tripId); };

  exitWarning = this.sessionSvc.exitWarning;

  trip = signal<any>(null);
  bookedSeats = signal<number[]>([]);
  selectedSeats = signal<number[]>([]);
  isLoading = signal<boolean>(true);
  platformFeePct = signal<number>(0);
  showLoginPrompt = signal<boolean>(false);
  noticeDismissed = signal<boolean>(false);

  baseAmount = computed(() => (this.trip()?.price ?? 0) * this.selectedSeats().length);
  platformFeeAmount = computed(() => Math.round(this.baseAmount() * this.platformFeePct() / 100));
  totalAmount = computed(() => this.baseAmount());

  seatMap = computed((): Seat[] => {
    const total = this.trip()?.busChairs ?? 45;
    const booked = this.bookedSeats();
    const sel = this.selectedSeats();
    return Array.from({ length: total }, (_, i) => {
      const n = i + 1;
      return { number: n, status: booked.includes(n) ? 'booked' : sel.includes(n) ? 'selected' : 'available' };
    });
  });

  mainRows = computed(() => {
    const seats = this.seatMap();
    const total = seats.length;
    const mainSeats = seats.slice(0, total - 5);
    const rows: Seat[][] = [];
    for (let i = 0; i < mainSeats.length; i += 4) rows.push(mainSeats.slice(i, i + 4));
    return rows;
  });

  backSeats = computed(() => this.seatMap().slice(-5));

  ngOnInit(): void {
    const pagePath = currentPath(this.router.url);
    this.jsonLd.set('page', pageGraph('حجز مقعد', pagePath, [{ name: 'حجز مقعد' }]));
    if (!this.authStore.isLoggedIn()) {
      this.showLoginPrompt.set(true);
      return;
    }
    this._tripId = this.route.snapshot.paramMap.get('tripId') ?? '';
    const nav = history.state?.trip;
    if (nav) this.trip.set(nav);
    if (this.trip()) {
      const trip = busTrip(this.trip());
      if (trip) this.jsonLd.set('trip', trip);
    }
    this.bookingSvc.getActiveFee().subscribe(fee => {
      if (fee) this.platformFeePct.set(Number(fee.percentage));
    });
    this.loadBookedSeats();
    this.sessionSvc.restoreFromStorage().then(state => {
      if (state && state.step !== 'seat') {
        this.router.navigate(['../' + state.step], { relativeTo: this.route });
      }
    });
    this.wsCleanups.push(this.ws.on('seat:updated', (data: any) => {
      if (data.tripId === this._tripId) this.loadBookedSeats();
    }));
    window.addEventListener('popstate', this.onPop);
    if (this._tripId) this.sessionSvc.exitWarning.set(null);
  }

  private loadBookedSeats(): void {
    this.bookingSvc.getBookedSeats(this._tripId).subscribe({
      next: r => { this.bookedSeats.set(r.data ?? []); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  ngOnDestroy(): void {
    this.wsCleanups.forEach(fn => fn());
    if (typeof window === 'undefined') return;
    window.removeEventListener('popstate', this.onPop);
  }

  async toggleSeat(seat: Seat): Promise<void> {
    if (seat.status === 'booked') return;
    const cur = this.selectedSeats();
    const next = cur.includes(seat.number) ? cur.filter(s => s !== seat.number) : [...cur, seat.number];
    this.selectedSeats.set(next);
    if (next.length > 0) {
      await this.sessionSvc.lockSeats(this._tripId, next);
    } else {
      await this.sessionSvc.releaseSeats();
    }
  }

  seatClasses(seat: Seat): string {
    const base = 'relative flex flex-col items-center justify-center gap-0.5 rounded-[10px] transition-all duration-150 active:scale-110 w-[46px] h-[52px]';
    switch (seat.status) {
      case 'selected': return `${base} bg-[var(--primary-hover)] border-2 border-[var(--primary)] shadow-[0_2px_8px_rgba(13,148,136,0.35)]`;
      case 'booked': return `${base} bg-[#E5E7EB] border-[1.5px] border-[var(--border)] cursor-not-allowed`;
      default: return `${base} bg-[var(--bg-card)] border-[1.5px] border-[var(--border)] hover:border-[var(--primary)]`;
    }
  }

  seatIconClasses(seat: Seat): string {
    switch (seat.status) {
      case 'selected': return 'text-white';
      case 'booked': return 'text-[#6B7280] opacity-[0.45]';
      default: return 'text-[var(--primary)]';
    }
  }

  seatNumberClasses(seat: Seat): string {
    switch (seat.status) {
      case 'selected': return 'text-white';
      case 'booked': return 'text-[#6B7280]';
      default: return 'text-[var(--text-secondary)]';
    }
  }

  async onNext(): Promise<void> {
    if (!this.selectedSeats().length) return;
    try { await this.sessionSvc.updateStep('passenger'); } catch {}
    this.router.navigate(['/passenger'], { state: {
      trip: this.trip(),
      selectedSeats: this.selectedSeats(),
      baseAmount: this.baseAmount(),
      platformFee: this.platformFeeAmount(),
      totalAmount: this.totalAmount(),
    }});
  }
  goToLogin(): void {
    this.router.navigate(['/m/login']);
  }
  goBack(): void {
    this.sessionSvc.exit(this._tripId);
    this.router.navigate(['/home']);
  }
}
