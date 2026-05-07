import { Injectable, signal } from '@angular/core';
import {
  BookingSession,
  InitialBookingData,
  ContactForm,
  PassengerForm,
  Passenger,
} from '../../../shared/booking-modal/booking-modal/booking.interfaces';

interface SessionWithExpiry {
  data: InitialBookingData | BookingSession;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private _session = signal<InitialBookingData | BookingSession | null>(null);
  private expiryTimer: any = null;
  private readonly SESSION_DURATION = 7 * 60 * 1000; // 7 minutes in milliseconds

  session = this._session.asReadonly();

  selectSeat(data: InitialBookingData): void {
    // Store session with expiry timestamp
    const sessionWithExpiry: SessionWithExpiry = {
      data: data,
      expiresAt: Date.now() + this.SESSION_DURATION,
    };
    
    // Save to localStorage (optional, for persistence on refresh)
    localStorage.setItem('selectSession', JSON.stringify(sessionWithExpiry));
    
    this._session.set(data);
    this.startExpiryTimer();
  }

  private startExpiryTimer(): void {
    // Clear any existing timer
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
    }
    
    // Set new timer to clear session after 20 minutes
    this.expiryTimer = setTimeout(() => {
      this.clear();
    }, this.SESSION_DURATION);
  }

  updateSeats(seats: number[]): void {
    const s = this._session();
    if (!s) return;
    this._session.set({ ...s, seatNumbers: seats });
    
    // Refresh the session expiry when user interacts
    this.refreshExpiry();
  }

  updateWithPassengerData(data: {
    name: string;
    age: number;
    gender: 'MALE' | 'FEMALE';
    passengerContact?: string;
    passenger?: Passenger[];
  }): void {
    const s = this._session();
    if (!s) return;
    
    const updatedSession: BookingSession = {
      ...s,
      name: data.name,
      age: data.age,
      gender: data.gender,
      passengerContact: data.passengerContact,
      passenger: data.passenger,
    };
    
    this._session.set(updatedSession);
    this.refreshExpiry();
  }

  getSession(): InitialBookingData | BookingSession | null {
    // Check expiry before returning session
    if (this.isExpired()) {
      this.clear();
      return null;
    }
    return this._session();
  }

  private isExpired(): boolean {
    const stored = localStorage.getItem('selectSession');
    if (!stored) return true;
    
    try {
      const sessionWithExpiry: SessionWithExpiry = JSON.parse(stored);
      if (Date.now() > sessionWithExpiry.expiresAt) {
        return true; // Session has expired
      }
      return false;
    } catch {
      return true;
    }
  }

  private refreshExpiry(): void {
    const stored = localStorage.getItem('selectSession');
    if (stored) {
      try {
        const sessionWithExpiry: SessionWithExpiry = JSON.parse(stored);
        if (this._session()) {
          // Refresh expiry timestamp
          sessionWithExpiry.expiresAt = Date.now() + this.SESSION_DURATION;
          localStorage.setItem('selectSession', JSON.stringify(sessionWithExpiry));
        }
      } catch (e) {
        console.error('Failed to refresh session expiry', e);
      }
    }
    
    // Restart the timer
    this.startExpiryTimer();
  }

  clear(): void { 
    this._session.set(null);
    localStorage.removeItem('selectSession');
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }
  
  // Optional: Call this on app initialization to restore session from localStorage
  restoreSession(): void {
    const stored = localStorage.getItem('selectSession');
    if (stored) {
      try {
        const sessionWithExpiry: SessionWithExpiry = JSON.parse(stored);
        if (Date.now() <= sessionWithExpiry.expiresAt) {
          this._session.set(sessionWithExpiry.data);
          const remainingTime = sessionWithExpiry.expiresAt - Date.now();
          if (remainingTime > 0) {
            this.expiryTimer = setTimeout(() => {
              this.clear();
            }, remainingTime);
          }
        } else {
          this.clear(); // Session expired
        }
      } catch (e) {
        console.error('Failed to restore session', e);
      }
    }
  }
}