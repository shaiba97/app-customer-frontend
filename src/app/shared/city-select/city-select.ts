import { Component, input, model, signal, computed, inject, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideMapPin } from '@lucide/angular';

@Component({
  selector: 'app-city-select',
  standalone: true,
  imports: [FormsModule, LucideMapPin],
  template: `
    <div class="relative w-full" dir="rtl">
      <div class="relative">
        <input
          type="text"
          [ngModel]="displayText()"
          (ngModelChange)="onInput($event)"
          (focus)="open()"
          (blur)="onBlur()"
          [placeholder]="placeholder()"
          class="w-full bg-transparent border-none outline-none text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:font-normal">
        @if (isOpen() && filteredCities().length > 0) {
          <div class="fixed z-50 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden" [style.width.px]="dropdownWidth()" [style.top.px]="dropdownTop()" [style.left.px]="dropdownLeft()">
            <div class="max-h-56 overflow-y-auto">
              @for (city of filteredCities(); track city) {
                <button type="button" (mousedown)="select(city)" class="w-full text-right px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--primary-light)] transition-colors border-b border-[var(--border)] last:border-b-0 flex items-center gap-2">
                  <svg lucideMapPin class="w-3.5 h-3.5 flex-shrink-0 text-[var(--text-muted)]"></svg>
                  {{ city }}
                </button>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class CitySelectComponent {
  private el = inject(ElementRef);

  placeholder = input('');

  value = model<string>('');

  searchTerm = signal('');
  isOpen = signal(false);
  dropdownTop = signal(0);
  dropdownLeft = signal(0);
  dropdownWidth = signal(0);

  allCities = input<string[]>([]);

  displayText = computed(() => {
    const val = this.value();
    if (val) return val;
    return this.searchTerm();
  });

  filteredCities = computed(() => {
    const term = this.searchTerm().trim();
    if (!term) return this.allCities();
    return this.allCities().filter(c => c.includes(term));
  });

  open(): void {
    this.updatePosition();
    this.isOpen.set(true);
  }

  close(): void {
    setTimeout(() => this.isOpen.set(false), 150);
  }

  onBlur(): void {
    this.close();
  }

  private updatePosition(): void {
    const inputEl = this.el.nativeElement.querySelector('input') as HTMLElement;
    if (!inputEl) return;
    const rect = inputEl.getBoundingClientRect();
    this.dropdownTop.set(rect.bottom + 4);
    this.dropdownLeft.set(rect.left);
    this.dropdownWidth.set(rect.width);
  }

  onInput(value: string): void {
    this.searchTerm.set(value);
    if (!this.isOpen()) {
      this.updatePosition();
      this.isOpen.set(true);
    }
  }

  select(city: string): void {
    this.searchTerm.set(city);
    this.value.set(city);
    this.isOpen.set(false);
  }
}
