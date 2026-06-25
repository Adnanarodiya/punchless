import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];

export type PostSummary = {
  totalPosts: number;
};

export async function getPosts(
  options: { includeDeleted?: boolean } = {}
): Promise<PostRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*")
    .order("name", { ascending: true });

  if (!options.includeDeleted) {
    query = query.eq("is_deleted", false);
  }

  const { data } = await query;
  return (data as PostRow[]) ?? [];
}

export async function getPostsSummary(): Promise<PostSummary> {
  const posts = await getPosts();
  return { totalPosts: posts.length };
}

export async function getPostById(postId: string): Promise<PostRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  return (data as PostRow) ?? null;
}