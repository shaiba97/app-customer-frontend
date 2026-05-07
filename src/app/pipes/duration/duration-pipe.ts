import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name:       'duration',
  standalone: true,
})
export class DurationPipe implements PipeTransform {
  transform(
    departure: string | Date,
    arrival:   string | Date
  ): string {
    if (!departure || !arrival) return '--';
    
    // Handle string time format like "01:00"
    const dep = typeof departure === 'string' && departure.includes(':') 
      ? new Date(`1970-01-01T${departure}`)
      : new Date(departure);
    const arr = typeof arrival === 'string' && arrival.includes(':')
      ? new Date(`1970-01-01T${arrival}`)
      : new Date(arrival);
      
    if (isNaN(dep.getTime()) ||
        isNaN(arr.getTime())) return '--';
    let diff = Math.abs(
      arr.getTime() - dep.getTime()
    );
    const hours   = Math.floor(diff / 3_600_000);
    const minutes = Math.floor(
      (diff % 3_600_000) / 60_000
    );
    if (hours === 0) return `${minutes} دقيقة`;
    if (minutes === 0) return `${hours} ساعة`;
    return `${hours}س ${minutes}د`;
  }
}