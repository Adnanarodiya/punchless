export type ReportPreset = "today" | "week" | "month" | "year" | "custom";

export type ReportPeriod = {
  preset: ReportPreset;
  start: string;
  end: string;
  label: string;
};

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthBounds(monthStr: string): { start: string; end: string; label: string } {
  const [year, month] = monthStr.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    start: formatDate(start),
    end: formatDate(end),
    label: start.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
  };
}

function yearBounds(yearStr: string): { start: string; end: string; label: string } {
  const year = Number(yearStr);
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    label: `Year ${year}`,
  };
}

export function resolveReportPeriod(
  params: {
    period?: string;
    start?: string;
    end?: string;
    month?: string;
    year?: string;
  },
  options: { mode?: "range" | "month" | "year" } = {}
): ReportPeriod {
  const mode = options.mode ?? "range";
  const now = new Date();

  if (mode === "month") {
    const month =
      params.month ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const bounds = monthBounds(month);
    return { preset: "month", ...bounds };
  }

  if (mode === "year") {
    const year = params.year || String(now.getFullYear());
    const bounds = yearBounds(year);
    return { preset: "year", ...bounds };
  }

  const preset = (params.period as ReportPreset) || "month";
  const today = formatDate(now);

  if (preset === "custom" && params.start && params.end) {
    return {
      preset: "custom",
      start: params.start,
      end: params.end,
      label: `${params.start} → ${params.end}`,
    };
  }

  if (preset === "today") {
    return { preset, start: today, end: today, label: "Today" };
  }

  if (preset === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return {
      preset,
      start: formatDate(start),
      end: today,
      label: "Last 7 days",
    };
  }

  if (preset === "year") {
    const bounds = yearBounds(String(now.getFullYear()));
    return { preset, ...bounds };
  }

  const bounds = monthBounds(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  return { preset: "month", ...bounds };
}

export function buildReportUrl(
  basePath: string,
  period: ReportPeriod,
  extra?: Record<string, string>
) {
  const params = new URLSearchParams();
  if (period.preset === "custom") {
    params.set("period", "custom");
    params.set("start", period.start);
    params.set("end", period.end);
  } else {
    params.set("period", period.preset);
  }
  for (const [key, value] of Object.entries(extra ?? {})) {
    params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}