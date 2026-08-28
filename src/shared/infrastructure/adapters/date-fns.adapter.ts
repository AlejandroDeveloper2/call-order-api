import { Injectable } from '@nestjs/common';
import { addDays, addHours, addMinutes, isAfter, isBefore } from 'date-fns';

import { DateHandlerPort } from '../../domain/ports';

@Injectable()
export class DateFnsAdapter implements DateHandlerPort {
  addDays(targetDate: Date, days: number): Date {
    return addDays(targetDate, days);
  }
  addMinutes(targetDate: Date, minutes: number): Date {
    return addMinutes(targetDate, minutes);
  }

  addHours(targetDate: Date, hours: number): Date {
    return addHours(targetDate, hours);
  }

  isAfter(date: Date, dateToCompare: Date): boolean {
    return isAfter(date, dateToCompare);
  }
  isBefore(date: Date, dateToCompare: Date): boolean {
    return isBefore(date, dateToCompare);
  }
}
