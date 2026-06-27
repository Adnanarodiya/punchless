import { getPosts, getPostsSummary } from "@/lib/queries/post.queries";
import { redirectUnlessFullDashboard } from "@/lib/utils/dashboard-experience-guard";
import { PostManager } from "./post-manager";

export default async function PostsPage() {
  await redirectUnlessFullDashboard("/dashboard/employees");

  const [posts, summary] = await Promise.all([getPosts(), getPostsSummary()]);

  return <PostManager posts={posts} summary={summary} />;
}