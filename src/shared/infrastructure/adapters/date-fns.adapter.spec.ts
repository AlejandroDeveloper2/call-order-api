import { DateFnsAdapter } from './date-fns.adapter';

describe('DateFnsAdapter', () => {
  const targetDate = new Date('2026-01-01T12:00:00.000Z');

  it('deberia sumar dias, horas y minutos', () => {
    // Arrange
    const adapter = new DateFnsAdapter();

    // Act
    const days = adapter.addDays(targetDate, 2);
    const hours = adapter.addHours(targetDate, 3);
    const minutes = adapter.addMinutes(targetDate, 30);

    // Assert
    expect(days).toEqual(new Date('2026-01-03T12:00:00.000Z'));
    expect(hours).toEqual(new Date('2026-01-01T15:00:00.000Z'));
    expect(minutes).toEqual(new Date('2026-01-01T12:30:00.000Z'));
  });

  it('deberia comparar fechas correctamente', () => {
    // Arrange
    const adapter = new DateFnsAdapter();
    const laterDate = new Date('2026-01-02T12:00:00.000Z');

    // Act
    const after = adapter.isAfter(laterDate, targetDate);
    const before = adapter.isBefore(targetDate, laterDate);

    // Assert
    expect(after).toBe(true);
    expect(before).toBe(true);
  });
});
