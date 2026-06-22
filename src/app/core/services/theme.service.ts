import { Injectable, signal, computed, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private document = inject(DOCUMENT);
  
  private _isDark = signal<boolean>(false);
  
  isDark = computed(() => this._isDark());
  
  constructor() {
    if (typeof window === 'undefined') return;
    
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      this._isDark.set(true);
      this.applyTheme(true);
    }
    
    effect(() => {
      if (typeof window === 'undefined') return;
      
      const isDark = this._isDark();
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      this.applyTheme(isDark);
    });
  }
  
  private applyTheme(isDark: boolean): void {
    const html = this.document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }
  
  toggle(): void {
    this._isDark.update(v => !v);
  }
}