/** Default staff/customer statement window — last 6 calendar months through today. */
export function defaultStatementDateRange(referenceDate = new Date()) {
  const end = new Date(referenceDate);
  const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}