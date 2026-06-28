export function normalizeClientName(value: string): string {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .replace(/\s+OK$/i, "")
    .trim();
}

export function parseParticularNameGst(raw: string): { name: string; gst: string | null } {
  const text = String(raw || "")
    .replace(/\r/g, "")
    .trim();
  const embedded = text.match(/^(.+?)\s*\(([0-9A-Z]{15})\)\s*$/i);
  if (embedded) {
    return { name: embedded[1].trim(), gst: embedded[2].toUpperCase() };
  }
  return { name: text, gst: null };
}

export type ClientMatchInput = {
  id: string;
  name: string;
  gst_number: string | null;
};

export type ClientMatchResult =
  | { clientId: string; matchedBy: "name" | "gst"; created: false }
  | { clientId: string; matchedBy: "new"; created: true };

export type ClientMatchCaches = {
  byExactName: Map<string, string>;
  byGst: Map<string, string>;
};

export function buildClientMatchCaches(clients: ClientMatchInput[]): ClientMatchCaches {
  const byExactName = new Map<string, string>();
  const byGst = new Map<string, string>();

  for (const client of clients) {
    const key = normalizeClientName(client.name);
    if (key && !byExactName.has(key)) {
      byExactName.set(key, client.id);
    }
    if (client.gst_number) {
      const gst = client.gst_number.toUpperCase();
      if (!byGst.has(gst)) byGst.set(gst, client.id);
    }
  }

  return { byExactName, byGst };
}

export function resolveClientMatch(
  caches: ClientMatchCaches,
  particular: string,
  gstinColumn: string | null
): { clientId: string | null; matchedBy: "name" | "gst" | null; name: string; gst: string | null } {
  const parsed = parseParticularNameGst(particular);
  const gst = (gstinColumn || parsed.gst || "").toUpperCase() || null;
  const nameKey = normalizeClientName(parsed.name);

  if (nameKey && caches.byExactName.has(nameKey)) {
    return {
      clientId: caches.byExactName.get(nameKey)!,
      matchedBy: "name",
      name: parsed.name,
      gst,
    };
  }

  if (gst && caches.byGst.has(gst)) {
    return {
      clientId: caches.byGst.get(gst)!,
      matchedBy: "gst",
      name: parsed.name,
      gst,
    };
  }

  return { clientId: null, matchedBy: null, name: parsed.name, gst };
}

export function registerClientInCaches(
  caches: ClientMatchCaches,
  clientId: string,
  name: string,
  gst: string | null
) {
  const nameKey = normalizeClientName(name);
  if (nameKey) caches.byExactName.set(nameKey, clientId);
  if (gst) caches.byGst.set(gst.toUpperCase(), clientId);
}