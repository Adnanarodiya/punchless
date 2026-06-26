import { z } from "zod";

const UUID_LOOSE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Any UUID-shaped ID (Postgres uuid, Supabase auth, demo seed data). */
export function entityId(message = "Invalid ID") {
  return z
    .string()
    .min(1, message)
    .regex(UUID_LOOSE_REGEX, message);
}