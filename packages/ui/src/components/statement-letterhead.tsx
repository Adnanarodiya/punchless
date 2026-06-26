import { cn } from "../lib/utils";

export interface StatementLetterheadProps {
  companyName: string;
  tagline?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  className?: string;
}

export function StatementLetterhead({
  companyName,
  tagline,
  address,
  phone,
  email,
  logoUrl,
  className,
}: StatementLetterheadProps) {
  const contactParts = [phone, email].filter(Boolean);

  return (
    <header
      data-slot="statement-letterhead"
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card text-center",
        className
      )}
    >
      <div className="statement-letterhead-banner px-6 py-5 text-primary-foreground">
        <h1 className="text-2xl font-bold tracking-[0.2em] uppercase sm:text-3xl">
          {companyName}
        </h1>
      </div>
      <div className="space-y-2 px-6 py-4 text-sm">
        {logoUrl ? (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={`${companyName} logo`}
              className="h-14 w-auto object-contain"
            />
          </div>
        ) : null}
        {tagline ? (
          <p className="font-medium text-muted-foreground">{tagline}</p>
        ) : null}
        {address ? (
          <p className="text-muted-foreground whitespace-pre-line">{address}</p>
        ) : null}
        {contactParts.length > 0 ? (
          <p className="text-muted-foreground">{contactParts.join(" · ")}</p>
        ) : null}
      </div>
    </header>
  );
}