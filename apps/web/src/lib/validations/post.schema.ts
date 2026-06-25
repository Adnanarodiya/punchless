import { z } from "zod";

export const createPostSchema = z.object({
  name: z.string().min(1, "Post name is required").max(100),
});

export const updatePostSchema = createPostSchema.extend({
  postId: z.string().uuid("Invalid post ID"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;