import { z } from "zod";

import {
  refineSettlementFields,
  settlementTypeSchema,
} from "@/lib/validations/settlement.schema";

export const generalEntrySchema = z
  .object({
    direction: z.enum(["receipt", "payment"]),
    paymentMode: z.enum(["cash", "bank"]),
    bankSubMode: z.enum(["upi", "net_banking", ""]).optional(),
    entryKind: z.enum(["party", "indirect"]),
    partySide: z.enum(["client", "supplier", ""]).optional(),
    partyId: z.string().optional(),
    settlementType: settlementTypeSchema.optional().default("direct"),
    billIds: z.array(z.string()).optional().default([]),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    entryDate: z.string().min(1, "Date is required"),
    remark: z.string().max(500).optional().or(z.literal("")),
    particular: z.string().max(200).optional().or(z.literal("")),
    bankId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMode === "bank" && !data.bankSubMode) {
      ctx.addIssue({
        code: "custom",
        message: "Select UPI or Net banking",
        path: ["bankSubMode"],
      });
    }
    if (data.entryKind === "party") {
      if (!data.partySide || !data.partyId?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Select a party",
          path: ["partyId"],
        });
      }
      refineSettlementFields(data, ctx);
    }
    if (data.entryKind === "indirect" && !data.particular?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Enter what this is for",
        path: ["particular"],
      });
    }
    if (data.paymentMode === "bank" && data.entryKind === "indirect") {
      ctx.addIssue({
        code: "custom",
        message: "Bank entries must be linked to a party",
        path: ["entryKind"],
      });
    }
    if (data.paymentMode === "bank" && !data.bankId?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Select a bank account",
        path: ["bankId"],
      });
    }
  });

export type GeneralEntryInput = z.infer<typeof generalEntrySchema>;