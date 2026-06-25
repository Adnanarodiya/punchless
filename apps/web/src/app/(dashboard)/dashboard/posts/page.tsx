import { getPosts, getPostsSummary } from "@/lib/queries/post.queries";
import { PostManager } from "./post-manager";

export default async function PostsPage() {
  const [posts, summary] = await Promise.all([getPosts(), getPostsSummary()]);

  return <PostManager posts={posts} summary={summary} />;
}