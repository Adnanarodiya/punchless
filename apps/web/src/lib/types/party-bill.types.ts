export type PartySearchResult =
  | {
      type: "party";
      partyId: string;
      name: string;
      alias: string | null;
      label: string;
    }
  | {
      type: "bill";
      billId: string;
      invoiceNumber: string;
      partyId: string;
      partyName: string;
      partyAlias: string | null;
      totalAmount: number;
      outstanding: number;
      label: string;
    };

export type OutstandingBill = {
  id: string;
  invoiceNumber: string | null;
  invoiceDate: string;
  totalAmount: number;
  outstanding: number;
};