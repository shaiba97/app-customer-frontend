import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

interface BackendTrip {
  fromCity: string;
  toCity: string;
}

@Injectable({ providedIn: 'root' })
export class CitiesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl.company;

  getAllCities(): Observable<string[]> {
    return this.http.get<BackendTrip[]>(`${this.apiUrl}/trips/available`).pipe(
      map(trips => {
        const cities = new Set<string>();
        trips.forEach(t => {
          if (t.fromCity) cities.add(t.fromCity);
          if (t.toCity) cities.add(t.toCity);
        });
        return Array.from(cities).sort();
      })
    );
  }
}
