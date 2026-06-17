import { Component, inject } from '@angular/core';
import { Location, NgClass } from '@angular/common';
import { LucideArrowRight, LucideChevronRight } from '@lucide/angular';
import { useIsMobile } from '../../shared/is-mobile';

@Component({
  selector: 'app-terms',
  imports: [NgClass, LucideArrowRight, LucideChevronRight],
  templateUrl: './terms.html',
})
export class TermsPage {
  private location = inject(Location);
  isMobile = useIsMobile();

  goBack(): void {
    this.location.back();
  }
}
