import { InfoHint } from "@/components/info-hint";
import {
  FY_DASHBOARD_HINT_BODY,
  FY_DASHBOARD_HINT_TITLE,
  FY_VS_CALENDAR_NOTE,
} from "@/lib/content/fy-calendar-copy";

type Variant = "dashboard" | "compact";

interface Props {
  variant?: Variant;
  className?: string;
}

/** Explains Indian FY vs calendar year — P2-4. */
export function FyCalendarHint({ variant = "dashboard", className }: Props) {
  if (variant === "compact") {
    return (
      <InfoHint title={FY_DASHBOARD_HINT_TITLE} className={className}>
        {FY_VS_CALENDAR_NOTE}
      </InfoHint>
    );
  }

  return (
    <InfoHint title={FY_DASHBOARD_HINT_TITLE} className={className}>
      <p>{FY_DASHBOARD_HINT_BODY}</p>
      <p className="mt-2">{FY_VS_CALENDAR_NOTE}</p>
    </InfoHint>
  );
}