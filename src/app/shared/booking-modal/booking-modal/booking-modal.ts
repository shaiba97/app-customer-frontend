import {
  Component, input, output, signal,
  computed, inject, OnInit, OnChanges, SimpleChanges,
} from '@angular/core';
import { NgClass, DatePipe } from '@angular/common';
import {
  LucideX,
  LucideArrowLeft,
  LucideArmchair,
  LucideUser,
  LucideCreditCard,
  LucideLoader,
  LucideDownload,
  LucideCheckCircle,
} from '@lucide/angular';
import {
  BookingStep,
  SeatMap,
  ContactForm,
  PassengerForm,
  PaymentGateway,
} from './booking.interfaces';
import { BookingService, TripDetails }
  from '../../../core/services/booking/booking';
import { TimeFormatPipe }
  from '../../../pipes/time-format/time-format-pipe';
import { SeatStepComponent }
  from '../steps/seat-step/seat-step';
import { PassengerStepComponent }
  from '../steps/passenger-step/passenger-step';
import { PaymentStepComponent }
  from '../steps/payment-step/payment-step';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Trips } from '../../../core/services/trips-service/trips';
import { SessionService } from '../../../core/services/session/session';

@Component({
  selector:   'app-booking-modal',
  standalone: true,
  imports: [
    NgClass,
    LucideX,
    LucideArrowLeft,
    LucideArmchair,
    LucideUser,
    LucideCreditCard,
    LucideLoader,
    LucideDownload,
    LucideCheckCircle,
    SeatStepComponent,
    PassengerStepComponent,
    PaymentStepComponent,
  ],
  templateUrl: './booking-modal.html',
})
export class BookingModalComponent
  implements OnInit, OnChanges {

  tripId  = input.required<string>();
  ticketId = input.required<string>();
  price   = input.required<number>();
  currency = input<string>('جنيه');
  closed  = output<void>();

  private bookingService = inject(BookingService);
  private tripService = inject(Trips);
  private sessionService = inject(SessionService);

  currentStep    = signal<BookingStep>('seat');
  tripDetails    = signal<TripDetails | null>(null);
  bookedSeats    = signal<number[]>([]);
  selectedSeats  = signal<number[]>([]);
  isLoading      = signal<boolean>(false);
  isSubmitting   = signal<boolean>(false);
  error          = signal<string>('');
  isSuccess      = signal<boolean>(false);
  bookingResults = signal<any[]>([]);
  ticketUrls     = signal<string[]>([]);
  ticketBaseUrl  = environment.apiUrl.customer.replace('/api', '');
  totalPrice = computed(() => this.selectedSeats().length * this.price());

  sessionId      = signal<string | null>(null);
  savedContact    = signal<ContactForm | null>(null);
  savedPassengers = signal<PassengerForm[]>([]);

  seatMap = computed((): SeatMap[] => {
    const trip  = this.tripDetails();
    const booked = this.bookedSeats();
    const sel   = this.selectedSeats();
    if (!trip) return [];
    const total = trip.Bus?.chairs || 45;
    return Array.from({ length: total }, (_, i) => {
      const n = i + 1;
      return {
        seatNumber: n,
        status: sel.includes(n)
          ? 'selected'
          : booked.includes(n)
            ? 'booked'
            : 'available',
      };
    });
  });

  canGoToPassenger = computed(
    () => this.selectedSeats().length > 0
  );

  canGoToPayment = computed(() =>
    this.savedContact() !== null &&
    this.savedPassengers().length > 0 &&
    this.savedPassengers().length ===
      this.selectedSeats().length
  );

  ngOnInit(): void { 
    this.loadTrip(); 
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tripId'] && this.tripId()) {
      this.loadTrip();
    }
  }

  loadTrip(): void {
    if (!this.tripId()) return;
    this.isLoading.set(true);
    this.tripService
      .getTripByProperty('id', this.tripId())
      .subscribe({
        next: (res: any) => {
          this.tripDetails.set(res);
          this.loadBookedSeats();
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(
            err?.error?.message ??
            'فشل في تحميل بيانات الرحلة'
          );
          this.isLoading.set(false);
        },
      });
  }

  loadBookedSeats(): void {
    this.bookingService
      .getBookedSeats(this.tripId())
      .subscribe({
        next: (res) =>
          this.bookedSeats.set(res.data ?? []),
        error: () => {},
      });
  }

  toggleSeat(seat: SeatMap): void {
    if (seat.status === 'booked') return;
    const current = this.selectedSeats();
    const exists  = current.includes(seat.seatNumber);
    const updated = exists
      ? current.filter(s => s !== seat.seatNumber)
      : [...current, seat.seatNumber];
    this.selectedSeats.set(updated);
  }

  async goToStep(step: BookingStep): Promise<void> {
    if (step === 'passenger' &&
        !this.canGoToPassenger()) return;
    if (step === 'payment' &&
        !this.canGoToPayment()) return;

    if (step === 'passenger' && this.selectedSeats().length > 0) {
      await this.startSession();
    }

    this.currentStep.set(step);
  }

  private async startSession(): Promise<void> {
    if (this.sessionId()) return;

    this.isLoading.set(true);
    this.error.set('');

    const data = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      tripId: this.tripDetails()!.id,
      seatNumbers: this.selectedSeats(),
      price: this.price(),
      totalAmount: this.totalPrice()
    }

    this.sessionService.selectSeat(data);
    
    // Store the generated ID
    this.sessionId.set(data.id);
    this.isLoading.set(false);

  }

  async onPassengerComplete(data: {
    contact:    ContactForm;
    passengers: PassengerForm[];
  }): Promise<void> {
    this.savedContact.set(data.contact);
    this.savedPassengers.set(data.passengers);

    const sid = this.sessionId();
    if (sid) {
      this.isLoading.set(true);
      this.error.set('');

      const phone =
        `${data.contact.countryCode}` +
        `${data.contact.whatsappNumber}`;

      this.sessionService.updateSeats(this.selectedSeats());
      this.isLoading.set(false);
      this.currentStep.set('payment');
    } else {
      this.currentStep.set('payment');
    }
  }

  // onPaymentConfirmed(data: {
  //   gateway:       PaymentGateway;
  //   transactionId: string;
  //   recieptFile:   File;
  // }): void {
  //   if (!this.savedContact() ||
  //       !this.savedPassengers().length) return;

  //   this.isSubmitting.set(true);
  //   this.error.set('');

  //   const phone =
  //     `${this.savedContact()!.countryCode}` +
  //     `${this.savedContact()!.whatsappNumber}`;

  //   const passengers = this.savedPassengers();

  //   const bookingRequests = this.selectedSeats()
  //     .map(seat => {
  //       const seatPassengers = passengers
  //         .filter(p => p.seatNumber === seat)
  //         .map(p => ({
  //           name:   p.name,
  //           age:    p.age!,
  //           gender: p.gender!,
  //         }));

  //       return this.bookingService.createBooking({
  //         customerId:       '0281279d-9ccb-47a9-add4-aa41c726b548',
  //         tripId:           this.tripId(),
  //         seatNumber:       seat,
  //         passenger:        seatPassengers,
  //         passengerContact: phone,
  //       })
        
  //       // .subscribe({
  //       //   next: (res: any) => { console.log('Booking Response =>', res) },
  //       //   error: (err: any) => { console.log('Booking Error', err) }
  //       // })
  //     });

  //   forkJoin(bookingRequests).pipe(
  //     switchMap((responses: any[]) => {
  //       const paymentRequests = responses.map(
  //         (res: any) => {
  //           const bookingId =
  //             res?.data?.id ?? res?.id;
  //           return this.bookingService
  //             .createPayment(
  //               {
  //                 bookingId: bookingId,
  //                 customerId: '0281279d-9ccb-47a9-add4-aa41c726b548',
  //                 price: this.price(),
  //                 totalAmount: this.price() *
  //                   this.selectedSeats().length,
  //                 companyAmount: (this.price() * this.selectedSeats().length) * 0.90,
  //                 commissionAmount: (this.price() * this.selectedSeats().length) * 0.10,
  //                 transactionId: data.transactionId,
  //               },
  //               data.recieptFile,
  //             ).subscribe({
  //               next: (res: any) => { console.log('Payment Response =>', res) },
  //               error: (err: any) => { console.log('Payment Error', err) }
  //             });
  //         }
  //       );
  //       return forkJoin(paymentRequests);
  //     })
  //   ).subscribe({
  //     next: (paymentResponses: any[]) => {
  //       const urls = paymentResponses
  //         .map(r => r?.data?.ticketUrl ?? '')
  //         .filter(Boolean);
  //       this.ticketUrls.set(urls);
  //       this.bookingResults.set(paymentResponses);
  //       this.isSubmitting.set(false);
  //       this.isSuccess.set(true);
  //       this.sessionId.set(null);
  //     },
  //     error: (err: any) => {
  //       console.error('Payment Error', err);
  //       this.error.set(
  //         err?.error?.message ??
  //         'حدث خطأ أثناء تأكيد الحجز'
  //       );
  //       this.isSubmitting.set(false);
  //     },
  //   });
  // }

//   onPaymentConfirmed(data: {
//   gateway: PaymentGateway;
//   transactionId: string;
//   recieptFile: File;
// }): void {
//   if (!this.savedContact() || !this.savedPassengers().length) return;

//   this.isSubmitting.set(true);
//   this.error.set('');

//   const phone = `${this.savedContact()!.countryCode}${this.savedContact()!.whatsappNumber}`;
//   const passengers = this.savedPassengers();

//   // Create booking requests (Observables, not subscriptions)
//   const bookingRequests = this.selectedSeats().map(seat => {
//     const seatPassengers = passengers
//       .filter(p => p.seatNumber === seat)
//       .map(p => ({
//         name: p.name,
//         age: p.age!,
//         gender: p.gender!,
//       }));

//     return this.bookingService.createBooking({
//       customerId: '0281279d-9ccb-47a9-add4-aa41c726b548',
//       tripId: this.tripId(),
//       seatNumber: seat,
//       passenger: seatPassengers,
//       passengerContact: phone,
//     });
//   });

//   // Wait for all bookings to complete, then create payments
//   forkJoin(bookingRequests).pipe(
//     switchMap((bookingResponses: any[]) => {
//       // Create payment requests for each successful booking
//       const paymentRequests = bookingResponses.map((response: any) => {
//         const bookingId = response?.data?.id ?? response?.id;
        
//         // Return the Observable, NOT a subscription
//         return this.bookingService.createPayment(
//           {
//             bookingId: bookingId,
//             customerId: '0281279d-9ccb-47a9-add4-aa41c726b548',
//             price: this.price(),
//             totalAmount: this.price() * this.selectedSeats().length,
//             companyAmount: (this.price() * this.selectedSeats().length) * 0.90,
//             commissionAmount: (this.price() * this.selectedSeats().length) * 0.10,
//             transactionId: data.transactionId,
//           },
//           data.recieptFile,
//         );
//       });
      
//       return forkJoin(paymentRequests);
//     })
//   ).subscribe({
//     next: (paymentResponses: any[]) => {
//       console.log('All payments successful:', paymentResponses);
      
//       // Extract ticket URLs from responses
//       const urls = paymentResponses
//         .map(r => r?.ticket?.ticketUrl ?? r?.data?.ticketUrl ?? '')
//         .filter(Boolean);
      
//       this.ticketUrls.set(urls);
//       this.bookingResults.set(paymentResponses);
//       this.isSubmitting.set(false);
//       this.isSuccess.set(true);
//       this.sessionId.set(null);
//     },
//     error: (err: any) => {
//       console.error('Payment/Booking Error:', err);
//       this.error.set(
//         err?.error?.message || 
//         err?.message || 
//         'حدث خطأ أثناء تأكيد الحجز'
//       );
//       this.isSubmitting.set(false);
//     },
//   });
// }

// booking-modal.component.ts - Updated onPaymentConfirmed
  

  onPaymentConfirmed(data: {
    gateway: PaymentGateway;
    transactionId: string;
    recieptFile: File;
  }): void {
    if (!this.savedContact() || !this.savedPassengers().length) return;

    this.isSubmitting.set(true);
    this.error.set('');

    const phone = `${this.savedContact()!.countryCode}${this.savedContact()!.whatsappNumber}`;
    const passengers = this.savedPassengers();

    // ✅ SINGLE BOOKING REQUEST for all seats
    const allPassengers = this.selectedSeats().map((seat, index) => {
      const passenger = passengers.find(p => p.seatNumber === seat);
      return {
        name: passenger?.name || '',
        age: passenger?.age || 0,
        gender: passenger?.gender || 'MALE'
      };
    });

    // Create ONE booking for ALL seats
    this.bookingService.createBooking({
      customerId: '0281279d-9ccb-47a9-add4-aa41c726b548',
      tripId: this.tripId(),
      seatNumbers: this.selectedSeats(),  // ✅ Array of all seats
      passenger: allPassengers,           // ✅ Array of all passengers (same order)
      passengerContact: phone,
    }).subscribe({
      next: (bookingResponse: any) => {
        const bookingId = bookingResponse?.data?.id ?? bookingResponse?.id;
        
        // Create ONE payment for the booking
        this.bookingService.createPayment(
          {
            bookingId: bookingId,
            customerId: '0281279d-9ccb-47a9-add4-aa41c726b548',
            price: this.price(),
            totalAmount: this.price() * this.selectedSeats().length,
            companyAmount: (this.price() * this.selectedSeats().length) * 0.90,
            commissionAmount: (this.price() * this.selectedSeats().length) * 0.10,
            transactionId: data.transactionId,
          },
          data.recieptFile,
        ).subscribe({
          next: (paymentResponse: any) => {
            console.log('Payment successful:', paymentResponse);
            const ticketUrl = paymentResponse?.ticket?.ticketUrl ?? '';
            this.ticketUrls.set([ticketUrl]);
            this.bookingResults.set([paymentResponse]);
            this.isSubmitting.set(false);
            this.isSuccess.set(true);
            this.sessionId.set(null);
          },
          error: (err: any) => {
            console.error('Payment Error:', err);
            this.error.set(err?.error?.message || 'حدث خطأ أثناء تأكيد الحجز');
            this.isSubmitting.set(false);
          },
        });
      },
      error: (err: any) => {
        console.error('Booking Error:', err);
        this.error.set(err?.error?.message || 'حدث خطأ أثناء إنشاء الحجز');
        this.isSubmitting.set(false);
      },
    });
  }

  onClose(): void { this.closed.emit(); }
}
