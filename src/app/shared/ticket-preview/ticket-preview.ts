import { Component, input, output, inject, signal, effect, DestroyRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LucideX } from '@lucide/angular';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ticket-preview',
  imports: [LucideX],
  template: `
    @if (visible()) {
      <div 
        class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label="عرض التذكرة"
      >
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="close()"></div>

        <div
          class="relative w-full sm:max-w-lg max-h-[90vh] bg-[var(--bg-card)] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up"
          (click)="$event.stopPropagation()"
        >
          <div class="flex sm:hidden items-center justify-center pt-3 pb-1">
            <div class="w-10 h-1 rounded-full bg-[var(--border)]"></div>
          </div>

          <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <h2 class="text-base font-bold text-[var(--text-primary)]">عرض التذكرة</h2>
            <button
              (click)="close()"
              class="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-all duration-150"
              aria-label="إغلاق"
            >
              <svg lucideX class="w-5 h-5"></svg>
            </button>
          </div>

          <div class="flex-1 overflow-auto bg-[var(--bg-base)] min-h-[50vh]">
            @if (ticketUrl()) {
              <embed
                [src]="safeUrl()"
                type="application/pdf"
                class="w-full h-[70vh] sm:h-[65vh]"
              />
            } @else {
              <div class="flex items-center justify-center h-[50vh] text-sm text-[var(--text-muted)]">
                لا توجد تذكرة متاحة
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      .animate-slide-up {
        animation: slideUp 0.3s ease-out;
      }
    `,
  ],
})
export class TicketPreviewComponent {
  ticketUrl = input<string>('');
  visible = input<boolean>(false);
  closed = output<void>();

  private sanitizer = inject(DomSanitizer);
  private destroyRef = inject(DestroyRef);
  private fileUrl = environment.apiUrl.customer.replace('/api-customer', '');
  private blobUrl = '';

  safeUrl = signal<SafeResourceUrl>('');

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.revokeBlobUrl();
    });

    effect(() => {
      const url = this.ticketUrl();
      this.revokeBlobUrl();
      if (!url) {
        this.safeUrl.set('');
        return;
      }
      if (url.startsWith('data:')) {
        this.resolveDataUrl(url);
      } else {
        this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.fileUrl + url));
      }
    });
  }

  private async resolveDataUrl(dataUrl: string) {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      this.blobUrl = URL.createObjectURL(blob);
      this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl));
    } catch {
      this.safeUrl.set('');
    }
  }

  private revokeBlobUrl() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = '';
    }
  }

  close(): void {
    this.closed.emit();
  }
}
