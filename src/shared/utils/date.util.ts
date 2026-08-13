const NIGERIA_TIMEZONE = "Africa/Lagos";

export function getCurrentBusinessDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NIGERIA_TIMEZONE,
  }).format(new Date());
}

export function getDayRange(date: string): {
  start: Date;
  end: Date;
} {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(date)) {
    throw new Error("Invalid date format.");
  }

  const start = new Date(`${date}T00:00:00+01:00`);

  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid date.");
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    start,
    end,
  };
}

export function getMonthRange(
  year: number,
  month: number,
): {
  start: Date;
  end: Date;
} {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Invalid year or month.");
  }

  const start = new Date(
    `${year}-${String(month).padStart(2, "0")}-01T00:00:00+01:00`,
  );

  const nextMonth =
    month === 12
      ? new Date(`${year + 1}-01-01T00:00:00+01:00`)
      : new Date(
          `${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00+01:00`,
        );

  return {
    start,
    end: nextMonth,
  };
}
