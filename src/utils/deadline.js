export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const MAX_DAYS = 365;

/**
 * Returns a soft background color string based on days remaining until deadline.
 * >= 60 days  → white
 * 30–60 days  → white → blue interpolation
 * 14–30 days  → blue → green interpolation
 * 3–14 days   → green → red interpolation
 * <= 3 days   → soft red
 */
export const getDeadlineColor = (deadlineMs, nowMs) => {
  const days = (deadlineMs - nowMs) / MS_PER_DAY;

  if (days >= 60) return "rgb(255, 255, 255)";
  if (days <= 3) return "rgb(255, 210, 210)";

  if (days <= 14) {
    const ratio = (days - 3) / 11;
    const r = Math.round(255 - ratio * (255 - 210));
    const g = Math.round(210 + ratio * (245 - 210));
    return `rgb(${r}, ${g}, 210)`;
  }

  if (days <= 30) {
    const ratio = (days - 14) / 16;
    const g = Math.round(245 - ratio * (245 - 230));
    const b = Math.round(210 + ratio * (255 - 210));
    return `rgb(210, ${g}, ${b})`;
  }

  const ratio = (days - 30) / 30;
  const r = Math.round(210 + ratio * (255 - 210));
  const g = Math.round(230 + ratio * (255 - 230));
  return `rgb(${r}, ${g}, 255)`;
};

/** Human-readable countdown or overdue string. */
export const formatTimeLeft = (deadlineMs, nowMs) => {
  const diff = deadlineMs - nowMs;
  const isOverdue = diff < 0;
  const abs = Math.abs(diff);

  const days = Math.floor(abs / MS_PER_DAY);
  const hours = Math.floor((abs % MS_PER_DAY) / (1000 * 60 * 60));
  const minutes = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));

  const label =
    days > 0
      ? `${days}d ${hours}h`
      : hours > 0
        ? `${hours}h ${minutes}m`
        : `${minutes}m`;

  return isOverdue ? `Overdue by ${label}` : `${label} remaining`;
};

/** Logarithmic slider → days (0–365). */
export const sliderToDays = (v) => Math.pow(MAX_DAYS + 1, v / 100) - 1;

/** Days → logarithmic slider position (0–100). */
export const daysToSlider = (days) =>
  days <= 0
    ? 0
    : Math.max(
        0,
        Math.min(100, (Math.log(days + 1) / Math.log(MAX_DAYS + 1)) * 100),
      );
