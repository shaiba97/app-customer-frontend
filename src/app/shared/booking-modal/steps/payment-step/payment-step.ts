import {
  Component, input, output, signal, computed, inject,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideCreditCard,
  LucideCheckCircle,
  LucideAlertCircle,
  LucideLoader,
  LucideSmartphone,
  LucideWallet,
  LucideLandmark,
  LucideUpload,
  LucideImage,
  LucideX,
  LucideFileCheck,
  LucideBus,
} from '@lucide/angular';

import { TimeFormatPipe } from '../../../../pipes/time-format/time-format-pipe';
import { BookingService, TripDetails } from '../../../../core/services/booking/booking';
import { ContactForm, PassengerForm, PaymentGateway } from '../../booking-modal/booking.interfaces';

@Component({
  selector:   'app-payment-step',
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    TimeFormatPipe,
    LucideCreditCard,
    LucideCheckCircle,
    LucideAlertCircle,
    LucideLoader,
    LucideSmartphone,
    LucideWallet,
    LucideLandmark,
    LucideUpload,
    LucideImage,
    LucideX,
    LucideFileCheck,
    LucideBus
  ],
  templateUrl: './payment-step.html',
})
export class PaymentStepComponent {

  private bookingService = inject(BookingService);

  tripDetails   = input.required<TripDetails>();
  selectedSeats = input.required<number[]>();
  passengers    = input.required<PassengerForm[]>();
  contact       = input.required<ContactForm>();
  price         = input.required<number>();
  currency      = input<string>('جنيه');
  isSubmitting  = input<boolean>(false);
  error         = input<string>('');
  boookedSeats = signal<any>([]);

  confirmed = output<{
    gateway:       PaymentGateway;
    transactionId: string;
    recieptFile:   File;
  }>();

  selectedGateway = signal<PaymentGateway | null>(null);
  transactionId   = signal<string>('');
  recieptFile     = signal<File | null>(null);
  recieptPreview  = signal<string>('');
  fileError       = signal<string>('');

  totalPrice = computed(
    () => this.selectedSeats().length * this.price()
  );

  whatsappFull = computed(() => {
    const c = this.contact();
    if (!c) return '';
    return `${c.countryCode}${c.whatsappNumber}`;
  });

  canSubmit = computed(() =>
    !!this.selectedGateway() &&
    this.transactionId().trim().length > 0 &&
    !!this.recieptFile() &&
    !this.isSubmitting()
  );

  paymentGateways: {
    id: PaymentGateway;
    name: string;
    lucideIcon: string;
  }[] = [
    { id: 'bankak',  name: 'بنكك',   lucideIcon: 'wallet'      },
    { id: 'fawry',   name: 'فوري',   lucideIcon: 'credit-card' },
    { id: 'mashriq', name: 'المشرق', lucideIcon: 'landmark'    },
    { id: 'bravo',   name: 'برافو',  lucideIcon: 'smartphone'  },
  ];

  ngOnInit(): void {
    this.getBookedSeats();
  }

  selectGateway(gw: PaymentGateway): void {
    this.selectedGateway.set(gw);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    this.fileError.set('');

    if (!file) return;

    const allowed = [
      'image/jpeg', 'image/jpg',
      'image/png',  'image/webp', 'image/heic',
    ];
    if (!allowed.includes(file.type)) {
      this.fileError.set(
        'نوع الملف غير مدعوم — يرجى رفع صورة (jpg, png, webp)'
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.fileError.set(
        'حجم الملف كبير — الحد الأقصى 5 ميغابايت'
      );
      return;
    }

    this.recieptFile.set(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      this.recieptPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  onRemoveFile(): void {
    this.recieptFile.set(null);
    this.recieptPreview.set('');
    this.fileError.set('');
  }

  onConfirm(): void {
    const gw   = this.selectedGateway();
    const txId = this.transactionId().trim();
    const file = this.recieptFile();

    if (!gw || !txId || !file || this.isSubmitting()) return;

    this.confirmed.emit({
      gateway:       gw,
      transactionId: txId,
      recieptFile:   file,
    });
  }

  gatewayName(id: PaymentGateway | null): string {
    if (!id) return '';
    return this.paymentGateways
      .find(g => g.id === id)?.name ?? '';
  }

  gatewayClasses(id: PaymentGateway): string[] {
    if (this.selectedGateway() === id)
      return [
        'border-[var(--primary)]',
        'bg-[var(--primary-light)]',
        'shadow-md',
      ];
    return [
      'border-[var(--border)]',
      'bg-[var(--bg-card)]',
      'hover:border-[var(--primary)]',
      'hover:bg-[var(--primary-light)]',
    ];
  }

  iconClasses(id: PaymentGateway): string[] {
    if (this.selectedGateway() === id)
      return ['text-white'];
    return ['text-[var(--primary)]'];
  }

  iconBgClasses(id: PaymentGateway): string[] {
    if (this.selectedGateway() === id)
      return ['bg-[var(--primary)'];
    return ['bg-[var(--bg-base)]'];
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
