/**
 * Philippine public holidays (regular + special non-working).
 * Fixed-date holidays are listed by MM-DD.
 * Movable holidays (e.g. Holy Week, Eid) are listed by YYYY-MM-DD.
 */

const FIXED_HOLIDAYS: Record<string, string> = {
  "01-01": "New Year's Day",
  "02-25": "EDSA People Power Revolution Anniversary",
  "04-09": "Araw ng Kagitingan (Day of Valor)",
  "05-01": "Labor Day",
  "06-12": "Independence Day",
  "08-21": "Ninoy Aquino Day",
  "11-01": "All Saints' Day",
  "11-02": "All Souls' Day",
  "11-30": "Bonifacio Day",
  "12-08": "Feast of the Immaculate Conception",
  "12-24": "Christmas Eve",
  "12-25": "Christmas Day",
  "12-30": "Rizal Day",
  "12-31": "New Year's Eve",
};

/** Movable holidays keyed by YYYY-MM-DD */
const MOVABLE_HOLIDAYS: Record<string, string> = {
  // 2025
  "2025-04-17": "Maundy Thursday",
  "2025-04-18": "Good Friday",
  "2025-04-19": "Black Saturday",
  "2025-03-31": "Eid'l Fitr",
  "2025-06-07": "Eid'l Adha",

  // 2026
  "2026-04-02": "Maundy Thursday",
  "2026-04-03": "Good Friday",
  "2026-04-04": "Black Saturday",
  "2026-03-20": "Eid'l Fitr",
  "2026-05-27": "Eid'l Adha",

  // 2027
  "2027-03-25": "Maundy Thursday",
  "2027-03-26": "Good Friday",
  "2027-03-27": "Black Saturday",
  "2027-03-09": "Eid'l Fitr",
  "2027-05-17": "Eid'l Adha",
};

export function getPhHoliday(date: Date): string | null {
  const yyyy = date.getFullYear().toString();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return getPhHolidayByDateKey(`${yyyy}-${mm}-${dd}`);
}

export function isPhHoliday(date: Date): boolean {
  return getPhHoliday(date) !== null;
}

export function getPhHolidayByDateKey(dateKey: string): string | null {
  const [, mm, dd] = dateKey.split("-");

  if (MOVABLE_HOLIDAYS[dateKey]) {
    return MOVABLE_HOLIDAYS[dateKey];
  }

  const fixedKey = `${mm}-${dd}`;
  if (FIXED_HOLIDAYS[fixedKey]) {
    return FIXED_HOLIDAYS[fixedKey];
  }

  return null;
}

export function isPhHolidayDateKey(dateKey: string): boolean {
  return getPhHolidayByDateKey(dateKey) !== null;
}
