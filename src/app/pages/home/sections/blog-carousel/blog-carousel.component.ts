import { Component, inject, signal, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { BlogService, BlogPost } from '../../../../core/services/blog/blog.service';
import {
  LucideCalendar,
  LucideArrowLeft,
  LucideChevronRight,
  LucideChevronLeft,
  LucideLoaderCircle,
  LucideFileText,
  LucideUser,
} from '@lucide/angular';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-blog-carousel',
  imports: [
    RouterLink,
    DatePipe,
    LucideCalendar,
    LucideArrowLeft,
    LucideChevronRight,
    LucideChevronLeft,
    LucideLoaderCircle,
    LucideFileText,
    LucideUser,
  ],
  templateUrl: './blog-carousel.component.html',
})
export class BlogCarouselComponent implements OnInit, OnDestroy {
  private blogSvc = inject(BlogService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  posts = signal<BlogPost[]>([]);
  loading = signal(true);
  error = signal(false);
  currentIndex = signal(0);

  visibleCards = 3;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private resizeObserver: ResizeObserver | null = null;

  getFileUrl(path: string): string {
    if (!path || path.startsWith('http')) return path;
    return `${environment.fileUrl}${path}`;
  }

  ngOnInit(): void {
    this.updateVisibleCards();

    if (typeof window !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateVisibleCards();
      });
      this.resizeObserver.observe(this.elementRef.nativeElement);
    }

    this.blogSvc.getPosts().subscribe({
      next: res => {
        this.posts.set(res);
        this.loading.set(false);
        this.startAutoPlay();
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
    this.resizeObserver?.disconnect();
  }

  private updateVisibleCards(): void {
    const w = window.innerWidth;
    this.visibleCards = w < 640 ? 1 : w < 1024 ? 2 : 3;
  }

  private startAutoPlay(): void {
    this.stopAutoPlay();
    this.intervalId = setInterval(() => this.next(), 4000);
  }

  private stopAutoPlay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  pause(): void { this.stopAutoPlay(); }
  resume(): void { this.startAutoPlay(); }

  next(): void {
    const max = this.maxIndex;
    this.currentIndex.update(i => (i >= max ? 0 : i + 1));
  }

  prev(): void {
    this.currentIndex.update(i => (i <= 0 ? this.maxIndex : i - 1));
  }

  goToSlide(index: number): void {
    this.currentIndex.set(index);
  }

  goToPost(slug: string): void {
    this.router.navigate(['/blogs/blog', slug]);
  }

  get transformStyle(): string {
    const total = this.posts().length;
    if (total === 0) return 'translateX(0px)';
    return `translateX(${-this.currentIndex() * 100 / total}%)`;
  }

  get maxIndex(): number {
    return Math.max(0, this.posts().length - this.visibleCards);
  }

  get slideCount(): number {
    return this.maxIndex + 1;
  }
}
