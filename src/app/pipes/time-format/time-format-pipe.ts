import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name:       'timeFormat',
  standalone: true,
})
export class TimeFormatPipe implements PipeTransform {
  transform(value: string | Date | null): string {
    if (!value) return '--:--';
    
    // Handle string time format like "01:00"
    if (typeof value === 'string' && value.includes(':')) {
      // Convert to Arabic numerals
      return value.replace(/\d/g, (digit) => {
        const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return arabicDigits[parseInt(digit)];
      });
    }
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleTimeString('ar-SA', {
      hour:   '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}