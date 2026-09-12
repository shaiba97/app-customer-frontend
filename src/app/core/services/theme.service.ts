import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _isDark = signal<boolean>(false);

  isDark = computed(() => this._isDark());
}