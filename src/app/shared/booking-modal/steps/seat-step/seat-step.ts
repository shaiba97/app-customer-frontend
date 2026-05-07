import {
  Component, input, output, computed,
  inject, signal
} from '@angular/core';
import { NgClass, JsonPipe } from '@angular/common';
import {
  LucideArmchair,
  LucideBus,
  LucideCalendar,
  LucideChevronLeft,
  LucideCircle,
} from '@lucide/angular';
import { TimeFormatPipe } from '../../../../pipes/time-format/time-format-pipe';
import { DatePipe } from '@angular/common';
import { SeatMap } from '../../booking-modal/booking.interfaces';
import { BookingService, TripDetails } from '../../../../core/services/booking/booking';
import { SessionService } from '../../../../core/services/session/session';

@Component({
  selector:   'app-seat-step',
  standalone: true,
  imports: [
    NgClass,
    DatePipe,
    TimeFormatPipe,
    JsonPipe,
    LucideArmchair,
    LucideBus,
    LucideCalendar,
    LucideChevronLeft,
    LucideCircle,
  ],
  templateUrl: './seat-step.html',
})
export class SeatStepComponent {

  private bookingService = inject(BookingService);

  tripDetails    = input.required<TripDetails>();
  seatMap        = input.required<SeatMap[]>();
  selectedSeats  = input.required<number[]>();
  price          = input.required<number>();
  currency       = input<string>('جنيه');

  seatToggled    = output<SeatMap>();
  nextStep       = output<void>();

  canProceed = computed(() => this.selectedSeats().length > 0);
  totalPrice = computed(() => this.selectedSeats().length * this.price());

  selectedSeat = signal<any>({});
  boookedSeats = signal<any>([]);

  busRows = computed(() => {
    const seats = this.seatMap();
    const trip  = this.tripDetails();
    if (!seats.length || !trip) return null;
    const total     = trip.Bus?.chairs || 45;
    const backCount = 5;
    const mainSeats = seats.slice(0, total - backCount);
    const backSeats = seats.slice(total - backCount);
    const left  =  2;
    const right =  2;
    const perRow = left + right;
    const rows: SeatMap[][] = [];
    for (let i = 0; i < mainSeats.length; i += perRow) {
      rows.push(mainSeats.slice(i, i + perRow));
    }
    return { rows, backSeats, left, right };
  });

  ngOnInit(): void {
    this.getSelectedSats();
    this.getBookedSeats();
  }

  getSelectedSats(){
      this.bookingService.getBooking('tripId', this.tripDetails().id).subscribe({
      next: (response: any) => {
        this.selectedSeat.set(response);
      },
      error: (error: any) => {
        console.error('Error fetching selected seats:', error.error.message);
      }
    });
  }

  seatClasses(seat: SeatMap): string[] {
    
    if (seat.status === 'selected') return ['text-white', 'drop-shadow-md', 'scale-110', 'cursor-pointer'];
    if (seat.status === 'booked') return ['text-[var(--text-muted)]', 'opacity-40', 'cursor-not-allowed'];
    return ['text-[var(--border)]', 'hover:text-[var(--primary)]', 'hover:scale-110', 'cursor-pointer', 'transition-all', 'duration-150'];
  }

  seatIconColor(seat: SeatMap): string {
    if (seat.status === 'selected') return 'var(--primary)';
    if (seat.status === 'booked') return 'var(--text-muted)';
    return 'currentColor';
  }

  onSeatClick(seat: SeatMap): void {
    if (seat.status === 'booked') return;
    this.seatToggled.emit(seat);
  }

  onNext(): void {    
    if (!this.canProceed()) return;
    this.nextStep.emit();
    
  }

  getBookedSeats(){

    this.bookingService.getBookedSeats(this.tripDetails().id).subscribe({
        next: (response: any) => {
          if(response.length){
            this.boookedSeats.set(response);
          }
        },
        error: (error: any) => {
          console.error('Error fetching selected seats:', error.error.message);
        }
    });

  }
}