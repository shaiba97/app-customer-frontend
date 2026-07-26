import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AwardPack {
  id: string;
  title: string;
  description: string;
  icon: string;
  minBookings: number;
  minTrips: number;
  activeDays: number;
  consecutiveDays: number;
  awardValue: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserAward {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  pack: AwardPack;
  createdAt: string;
}

export interface UserStats {
  totalBookings: number;
  uniqueTrips: number;
  activeDays: number;
  consecutiveDays: number;
}

@Injectable({ providedIn: 'root' })
export class AwardsService {
  private http = inject(HttpClient);
  private api = environment.apiUrl.customer;

  getMyAwards(): Observable<UserAward[]> {
    return this.http.get<UserAward[]>(`${this.api}/awards`);
  }

  getPacks(): Observable<AwardPack[]> {
    return this.http.get<AwardPack[]>(`${this.api}/awards/packs`);
  }
}
