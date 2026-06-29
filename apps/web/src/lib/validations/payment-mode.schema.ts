import { z } from "zod";

export const paymentModeSchema = z.enum(["cash", "bank", "credit"]);

export const bankSubModeSchema = z.enum(["upi", "net_banking", ""]).optional();

export function refineBankPaymentFields(
  data: { paymentMode: string; bankId?: string; bankSubMode?: string },
  ctx: z.RefinementCtx
) {
  if (data.paymentMode !== "bank") return;

  if (!data.bankSubMode) {
    ctx.addIssue({
      code: "custom",
      message: "Select UPI or Net banking",
      path: ["bankSubMode"],
    });
  }

  if (!data.bankId?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Select a bank account",
      path: ["bankId"],
    });
  }
}

export function parseBankPaymentFields(formData: FormData) {
  const paymentMode = String(formData.get("paymentMode") || "");
  const bankIdRaw = String(formData.get("bankId") || "").trim();
  const bankSubModeRaw = String(formData.get("bankSubMode") || "");

  return {
    bankId: paymentMode === "bank" && bankIdRaw ? bankIdRaw : null,
    bankSubMode:
      paymentMode === "bank" && bankSubModeRaw
        ? (bankSubModeRaw as "upi" | "net_banking")
        : null,
  };
}