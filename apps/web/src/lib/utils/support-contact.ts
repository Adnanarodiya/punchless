/** Digits only, with leading country code when present (e.g. +91 → 91…). */
export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length >= 12) {
    return digits;
  }
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

export function getSupportPhoneDisplay(): string | null {
  const phone = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim();
  return phone || null;
}

export function getSupportTelHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

export function getSupportWhatsAppHref(
  phone: string,
  message = "Hi, I need help with Punchless."
): string {
  const normalized = normalizePhoneForWhatsApp(phone);
  const text = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${text}`;
}

export function isSupportContactConfigured(): boolean {
  return Boolean(getSupportPhoneDisplay());
}