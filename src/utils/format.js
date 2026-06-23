/** Format a timestamp as a datetime-local input value (local time). */
export const formatLocalDatetime = (ts) => {
  const d = new Date(ts);
  const pad = (n) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Parse a datetime-local string to a UTC timestamp (ms). */
export const parseLocalDatetime = (str) => new Date(str).getTime();
