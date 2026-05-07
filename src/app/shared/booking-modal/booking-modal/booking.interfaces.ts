export type BookingStep =
  'seat' | 'passenger' | 'payment';

export type SeatStatus =
  'available' | 'booked' | 'selected';

export interface SeatMap {
  seatNumber: number;
  status:     SeatStatus;
  gender?:    'MALE' | 'FEMALE' | null;
}

export interface PassengerForm {
  seatNumber:  number;
  name:        string;
  age:         number | null;
  gender:      'MALE' | 'FEMALE' | null;
}

export interface PassengerItem {
  name:   string;
  age:    number;
  gender: 'MALE' | 'FEMALE';
}

export interface ContactForm {
  countryCode:    string;
  whatsappNumber: string;
}

export type PaymentGateway =
  'bankak' | 'fawry' | 'mashriq' | 'bravo';

export interface PaymentSubmission {
  bookingId:     string;
  paymentMethod: PaymentGateway;
  transactionId: string;
  recieptFile:   File;
  totalAmount:   number;
  currency:      string;
}

export interface Passenger {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
}

export interface InitialBookingData {
  tripId:      string;
  price:       number;
  id:          string;
  seatNumbers: number[];
  totalAmount: number;
  createdAt:   Date;
}

export interface BookingSession extends InitialBookingData {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  passengerContact?: string;
  passenger?: Passenger[];
}

