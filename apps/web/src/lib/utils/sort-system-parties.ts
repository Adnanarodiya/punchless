import {
  SYSTEM_EXPENSE_SUPPLIER_NAME,
  SYSTEM_INCOME_CLIENT_NAME,
} from "@/lib/constants/system-parties";

type NamedParty = { name: string; is_system?: boolean | null };

function systemPartyRank(party: NamedParty): number {
  if (party.is_system || party.name === SYSTEM_INCOME_CLIENT_NAME) return 0;
  if (party.name === SYSTEM_EXPENSE_SUPPLIER_NAME) return 0;
  return 1;
}

export function sortPartiesWithSystemFirst<T extends NamedParty>(parties: T[]): T[] {
  return [...parties].sort((a, b) => {
    const rankDiff = systemPartyRank(a) - systemPartyRank(b);
    if (rankDiff !== 0) return rankDiff;
    return a.name.localeCompare(b.name);
  });
}