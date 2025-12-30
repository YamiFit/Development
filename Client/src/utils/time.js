const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DAY_ALIASES = {
  sun: "sunday",
  mon: "monday",
  tue: "tuesday",
  wed: "wednesday",
  thu: "thursday",
  fri: "friday",
  sat: "saturday",
};

const TZ = "Asia/Amman";

const toInt = (value) => Number.parseInt(value, 10);

const toMinutes = (timeStr = "") => {
  if (typeof timeStr !== "string") return null;
  const parts = timeStr.split(":");
  if (parts.length < 2) return null;
  const h = toInt(parts[0]);
  const m = toInt(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const getNowInAmmanParts = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const weekday = parts.find((p) => p.type === "weekday")?.value?.toLowerCase();
  const hour = toInt(parts.find((p) => p.type === "hour")?.value);
  const minute = toInt(parts.find((p) => p.type === "minute")?.value);
  const second = toInt(parts.find((p) => p.type === "second")?.value);

  const todayKey = DAY_ALIASES[weekday] || weekday;

  return {
    todayKey,
    hour: Number.isNaN(hour) ? 0 : hour,
    minute: Number.isNaN(minute) ? 0 : minute,
    second: Number.isNaN(second) ? 0 : second,
  };
};

export const mapWorkingHoursRows = (rows = []) => {
  if (!Array.isArray(rows)) return {};

  const parseRangeString = (value) => {
    if (typeof value !== "string") return null;
    const normalized = value.replace("–", "-");
    const [start, end] = normalized.split("-").map((s) => s?.trim());
    if (!start || !end) return null;
    return { start, end };
  };

  return rows.reduce((acc, row) => {
    const day = row?.day_of_week?.toLowerCase?.();
    if (!day) return acc;

    if (row.is_open === false) {
      acc[day] = [];
      return acc;
    }

    const shifts = [];
    const openTime = typeof row.open_time === "string" ? row.open_time.slice(0, 5) : null;
    const closeTime = typeof row.close_time === "string" ? row.close_time.slice(0, 5) : null;
    if (openTime && closeTime) {
      shifts.push({ start: openTime, end: closeTime });
    }

    const slots = row.delivery_slots;
    if (Array.isArray(slots)) {
      for (const slot of slots) {
        if (typeof slot === "string") {
          const parsed = parseRangeString(slot);
          if (parsed) shifts.push(parsed);
        } else if (slot && typeof slot === "object") {
          const start = slot.start || slot.open || slot.from;
          const end = slot.end || slot.close || slot.to;
          if (typeof start === "string" && typeof end === "string") {
            shifts.push({ start: start.slice(0, 5), end: end.slice(0, 5) });
          }
        }
      }
    }

    // de-dupe
    const seen = new Set();
    acc[day] = shifts.filter((s) => {
      const key = `${s.start}-${s.end}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return acc;
  }, {});
};

const parseWorkingHours = (workingHours) => {
  if (!workingHours) return {};

  // Support provider_working_hours rows input (array of rows)
  if (Array.isArray(workingHours) && workingHours[0]?.day_of_week) {
    return mapWorkingHoursRows(workingHours);
  }

  if (typeof workingHours === "string") {
    try {
      return JSON.parse(workingHours);
    } catch (e) {
      return {};
    }
  }

  return workingHours || {};
};

const normalizeShifts = (rawShifts) => {
  if (!Array.isArray(rawShifts)) return [];
  return rawShifts
    .map((shift) => {
      const start = toMinutes(shift.start || shift.open || shift.from);
      const end = toMinutes(shift.end || shift.close || shift.to);
      if (start === null || end === null) return null;
      return { start, end };
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);
};

const getTodayKey = (date) => {
  const jsDay = date.getDay(); // 0 Sunday
  return DAY_KEYS[jsDay];
};

export const getAvailability = (workingHoursInput) => {
  const now = new Date();
  const { todayKey, hour, minute } = getNowInAmmanParts();
  const minutesNow = hour * 60 + minute;
  const workingHours = parseWorkingHours(workingHoursInput);

  const todayRaw =
    workingHours[todayKey] ||
    workingHours[todayKey?.slice(0, 3)] ||
    workingHours[DAY_ALIASES[todayKey]];

  const todayShifts = normalizeShifts(todayRaw);

  const isOpen = todayShifts.some((shift) => {
    return minutesNow >= shift.start && minutesNow < shift.end;
  });

  return {
    isOpen,
    todayShifts,
    now,
    todayKey,
  };
};

export const formatShiftsForDisplay = (shifts) => {
  if (!Array.isArray(shifts) || shifts.length === 0) return "Schedule unavailable";
  return shifts
    .map((s) => {
      const pad = (n) => String(n).padStart(2, "0");
      const toTime = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
      return `${toTime(s.start)}–${toTime(s.end)}`;
    })
    .join(", ");
};

export const weeklyOrder = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

export const normalizeWeekly = (workingHoursInput) => {
  const workingHours = parseWorkingHours(workingHoursInput);
  return weeklyOrder.map((day) => {
    const raw =
      workingHours[day] ||
      workingHours[day?.slice(0, 3)] ||
      workingHours[DAY_ALIASES[day]] ||
      [];
    return {
      day,
      shifts: normalizeShifts(raw),
    };
  });
};
