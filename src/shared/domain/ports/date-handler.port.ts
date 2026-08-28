export abstract class DateHandlerPort {
  abstract addDays: (targetDate: Date, days: number) => Date;
  abstract addMinutes: (targetDate: Date, minutes: number) => Date;
  abstract addHours: (targetDate: Date, hours: number) => Date;
  abstract isAfter: (date: Date, dateToCompare: Date) => boolean;
  abstract isBefore: (date: Date, dateToCompare: Date) => boolean;
}

export const DATE_HANDLER = Symbol('DATE_HANDLER');
