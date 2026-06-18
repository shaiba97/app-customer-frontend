import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
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

  posts = signal<BlogPost[]>([]);
  loading = signal(true);
  error = signal(false);
  currentIndex = signal(0);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  visibleCards = 0;

  getFileUrl(path: string): string {
    if (!path || path.startsWith('http')) return path;
    return `${environment.fileUrl}${path}`;
  }

  ngOnInit(): void {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    this.visibleCards = w < 640 ? 1 : w < 1024 ? 2 : 3;

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResize);
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
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize);
    }
  }

  private onResize = (): void => {
    const w = window.innerWidth;
    this.visibleCards = w < 640 ? 1 : w < 1024 ? 2 : 3;
  };

  private startAutoPlay(): void {
    this.stopAutoPlay();
    this.intervalId = setInterval(() => {
      this.next();
    }, 4000);
  }

  private stopAutoPlay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  pause(): void {
    this.stopAutoPlay();
  }

  resume(): void {
    this.startAutoPlay();
  }

  next(): void {
    this.currentIndex.update(i => (i >= this.maxIndex ? 0 : i + 1));
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

  get translateX(): string {
    const pct = this.currentIndex() * (100 / this.visibleCards);
    return `translateX(${-pct}%)`;
  }

  get maxIndex(): number {
    return Math.max(0, this.posts().length - this.visibleCards);
  }

  get slideCount(): number {
    return this.maxIndex + 1;
  }
}
