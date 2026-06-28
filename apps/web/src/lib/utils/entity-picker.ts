export type NamedEntity = {
  id: string;
  name: string;
  alias: string | null;
  is_deleted?: boolean;
};

export function entityDisplayLabel(entity: Pick<NamedEntity, "name" | "alias">) {
  return entity.alias ? `${entity.name} (${entity.alias})` : entity.name;
}

export function findEntityByQuery<T extends NamedEntity>(
  entities: T[],
  query: string
): T | undefined {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return undefined;

  return entities.find(
    (entity) =>
      entity.name.toLowerCase() === trimmed ||
      (entity.alias?.toLowerCase() === trimmed)
  );
}

export function filterEntitiesByQuery<T extends NamedEntity>(
  entities: T[],
  query: string,
  limit = 8
): T[] {
  const active = entities.filter((entity) => !entity.is_deleted);
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return active.slice(0, limit);

  return active
    .filter(
      (entity) =>
        entity.name.toLowerCase().includes(trimmed) ||
        (entity.alias?.toLowerCase().includes(trimmed) ?? false)
    )
    .slice(0, limit);
}

export function isNewEntityName<T extends NamedEntity>(
  entities: T[],
  query: string
): boolean {
  const trimmed = query.trim();
  return trimmed.length > 0 && !findEntityByQuery(entities, trimmed);
}