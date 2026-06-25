/** Indian financial year: 1 Apr → 31 Mar */

export function getCurrentFinancialYearStartYear(date = new Date()): number {
  const month = date.getMonth();
  const year = date.getFullYear();
  return month >= 3 ? year : year - 1;
}

export function formatFinancialYearLabel(startYear: number): string {
  const endSuffix = String((startYear + 1) % 100).padStart(2, "0");
  return `FY ${startYear}-${endSuffix}`;
}

export function getFinancialYearRange(startYear: number): {
  start: string;
  end: string;
  label: string;
} {
  return {
    start: `${startYear}-04-01`,
    end: `${startYear + 1}-03-31`,
    label: formatFinancialYearLabel(startYear),
  };
}

export function getFinancialYearRangeToDate(
  startYear: number,
  ref = new Date()
): { start: string; end: string; label: string } {
  const range = getFinancialYearRange(startYear);
  const today = ref.toISOString().slice(0, 10);
  return {
    ...range,
    end: today < range.end ? today : range.end,
  };
}

export function parseFinancialYearParam(
  value: string | undefined,
  fallback = getCurrentFinancialYearStartYear()
): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 2000 || parsed > 2100) {
    return fallback;
  }
  return parsed;
}

/** Map a calendar date to the FY start year (Apr–Mar). */
export function getFinancialYearStartYearForDate(dateStr: string): number {
  const [yearPart, monthPart] = dateStr.slice(0, 10).split("-");
  const year = parseInt(yearPart, 10);
  const month = parseInt(monthPart, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return getCurrentFinancialYearStartYear();
  }
  return month >= 4 ? year : year - 1;
}

export type FinancialYearOption = { value: number; label: string };

/** FY years that have data, newest first. */
export function buildFinancialYearOptions(
  yearsWithData: number[]
): FinancialYearOption[] {
  return [...new Set(yearsWithData)]
    .sort((a, b) => b - a)
    .map((year) => ({ value: year, label: formatFinancialYearLabel(year) }));
}

/**
 * Build select options: data years only, but prepend current FY when it is
 * the active default and has no transactions yet (so the select can show it).
 */
export function buildFinancialYearSelectOptions(
  yearsWithData: number[],
  selectedFy: number,
  currentFy = getCurrentFinancialYearStartYear(),
  hasExplicitFyParam = false
): FinancialYearOption[] {
  const dataOptions = buildFinancialYearOptions(yearsWithData);

  if (dataOptions.some((opt) => opt.value === selectedFy)) {
    return dataOptions;
  }

  if (selectedFy === currentFy && !hasExplicitFyParam) {
    return [
      { value: currentFy, label: formatFinancialYearLabel(currentFy) },
      ...dataOptions,
    ];
  }

  return dataOptions;
}

/**
 * Resolve which FY drives the dashboard financial cards.
 * Default = current FY; URL `?fy=` only applies when that year has data.
 */
export function resolveDashboardFinancialYear(
  paramFy: string | undefined,
  yearsWithData: number[],
  currentFy = getCurrentFinancialYearStartYear()
): number {
  if (!paramFy) return currentFy;

  const requested = parseFinancialYearParam(paramFy, currentFy);
  return yearsWithData.includes(requested) ? requested : currentFy;
}