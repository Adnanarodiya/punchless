"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import { createPostSchema, updatePostSchema } from "@/lib/validations/post.schema";

function revalidatePostPages() {
  revalidatePath("/dashboard/posts");
  revalidatePath("/dashboard/employees");
}

export const createPost = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_post", entityType: "post" },
})(async (formData, { supabase, me }) => {
  const parsed = createPostSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { error } = await supabase.from("posts").insert({
    company_id: me.company_id,
    name: parsed.data.name.trim(),
  } as never);

  if (error) return { success: false, error: error.message };

  revalidatePostPages();
  return { success: true };
});

export const updatePost = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "update_post", entityType: "post" },
})(async (formData, { supabase }) => {
  const parsed = updatePostSchema.safeParse({
    postId: formData.get("postId"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { error } = await supabase
    .from("posts")
    .update({ name: parsed.data.name.trim() } as never)
    .eq("id", parsed.data.postId);

  if (error) return { success: false, error: error.message };

  revalidatePostPages();
  return { success: true };
});

export const softDeletePost = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "soft_delete_post", entityType: "post" },
})(async (formData, { supabase }) => {
  const postId = String(formData.get("postId") || "");
  if (!postId) return { success: false, error: "Post ID required" };

  const { error } = await supabase
    .from("posts")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    } as never)
    .eq("id", postId);

  if (error) return { success: false, error: error.message };

  revalidatePostPages();
  return { success: true };
});

export const recoverPost = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "recover_post", entityType: "post" },
})(async (formData, { supabase }) => {
  const postId = String(formData.get("postId") || "");
  if (!postId) return { success: false, error: "Post ID required" };

  const { error } = await supabase
    .from("posts")
    .update({
      is_deleted: false,
      deleted_at: null,
    } as never)
    .eq("id", postId);

  if (error) return { success: false, error: error.message };

  revalidatePostPages();
  return { success: true };
});