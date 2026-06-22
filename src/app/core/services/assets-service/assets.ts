import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Assets {
  
  getAllCities(){
    return [
      { "state": "الخرطوم", "city": "الخرطوم" },
      { "state": "الجزيرة", "city": "ود مدني" },
      { "state": "البحر الأحمر", "city": "بورتسودان" },
      { "state": "كسلا", "city": "كسلا" },
      { "state": "القضارف", "city": "القضارف" },
      { "state": "سنار", "city": "سنجة" },
      { "state": "النيل الأبيض", "city": "ربك" },
      { "state": "النيل الأزرق", "city": "الدمازين" },
      { "state": "الشمالية", "city": "دنقلا" },
      { "state": "نهر النيل", "city": "الدامر" },
      { "state": "شمال كردفان", "city": "الأبيض" },
      { "state": "جنوب كردفان", "city": "كادوقلي" },
      { "state": "غرب كردفان", "city": "الفولة" },
      { "state": "شمال دارفور", "city": "الفاشر" },
      { "state": "جنوب دارفور", "city": "نيالا" },
      { "state": "غرب دارفور", "city": "الجنينة" },
      { "state": "وسط دارفور", "city": "زالنجي" },
      { "state": "شرق دارفور", "city": "الضعين" }
    ]
  }
}
