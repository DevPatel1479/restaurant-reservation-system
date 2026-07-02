import { ApiError } from './apiError.js';

const TIME_SLOT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const toMinutes = (time) => {
  if (!TIME_SLOT_REGEX.test(time)) {
    throw new ApiError(400, `Invalid time format: ${time}`);
  }
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const normalizeDate = (date) => {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ApiError(400, 'Date must be in YYYY-MM-DD format');
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, `Invalid date format: ${date}`);
  }
  return date;
};

export const buildTimeSlotLabel = (startTime, endTime) => `${startTime}-${endTime}`;

export const validateRestaurantHours = (startTime, endTime, openTime = '10:00', closeTime = '23:00') => {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const open = toMinutes(openTime);
  const close = toMinutes(closeTime);

  if (end <= start) {
    throw new ApiError(400, 'End time must be after start time');
  }
  if (start < open || end > close) {
    throw new ApiError(400, `Reservations must be within restaurant hours ${openTime} - ${closeTime}`);
  }
};

export const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;
