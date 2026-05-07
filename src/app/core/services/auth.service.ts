import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _token = signal<string | null>(null);
  private _user = signal<User | null>(null);
  
  isLoggedIn = computed(() => !!this._token());
  currentUser = computed(() => this._user());
  
  constructor(private router: Router) {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }
  
  private loadFromStorage(): void {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this._token.set(token);
        this._user.set(user);
      } catch {
        this.clearStorage();
      }
    }
  }
  
  private clearStorage(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._token.set(null);
    this._user.set(null);
  }
  
  login(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this._token.set(token);
    this._user.set(user);
  }
  
  logout(): void {
    this.clearStorage();
    this.router.navigate(['/auth/login']);
  }
}