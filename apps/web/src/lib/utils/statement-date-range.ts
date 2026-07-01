/** Default statement window — rolling 12 months through today. */
export function defaultStatementDateRange(referenceDate = new Date()) {
  const end = new Date(referenceDate);
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 1);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}