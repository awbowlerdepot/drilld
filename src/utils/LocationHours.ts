import { Location } from '../types';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** Lower-case weekday name ('monday', ...) matching the keys of Location.hours. */
export const getDayName = (date: Date = new Date()): string => DAY_NAMES[date.getDay()];

/** The location's hours text for the given day, or undefined if none is set. */
export const getHoursForDay = (location: Pick<Location, 'hours'>, date: Date = new Date()): string | undefined =>
    location.hours?.[getDayName(date)];

/** Whether an hours entry means closed (missing, blank, or "Closed"). */
export const isClosedHours = (hours: string | undefined): boolean =>
    !hours || hours.trim() === '' || hours.trim().toLowerCase() === 'closed';

/** Whether an active location has opening hours on the given day. */
export const isOpenOnDay = (location: Pick<Location, 'hours' | 'active'>, date: Date = new Date()): boolean =>
    location.active && !isClosedHours(getHoursForDay(location, date));
