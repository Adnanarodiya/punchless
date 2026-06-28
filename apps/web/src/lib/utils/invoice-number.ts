const DEFAULT_PREFIX = "ISHABA";

/** Build full sales bill number from company prefix + user suffix. */
export function formatSalesInvoiceNumber(prefix: string | null | undefined, suffix: string) {
  const cleanPrefix = (prefix || DEFAULT_PREFIX).trim().toUpperCase() || DEFAULT_PREFIX;
  const cleanSuffix = suffix.trim().replace(/^[-/]+/, "");
  if (!cleanSuffix) return cleanPrefix;
  return `${cleanPrefix}-${cleanSuffix}`;
}

export function parseSalesInvoiceSuffix(
  prefix: string | null | undefined,
  fullNumber: string | null | undefined
) {
  if (!fullNumber) return "";
  const cleanPrefix = (prefix || DEFAULT_PREFIX).trim().toUpperCase();
  const upper = fullNumber.trim().toUpperCase();
  if (upper.startsWith(`${cleanPrefix}-`)) {
    return fullNumber.slice(cleanPrefix.length + 1);
  }
  if (upper.startsWith(cleanPrefix)) {
    return fullNumber.slice(cleanPrefix.length).replace(/^[-/]+/, "");
  }
  return fullNumber;
}