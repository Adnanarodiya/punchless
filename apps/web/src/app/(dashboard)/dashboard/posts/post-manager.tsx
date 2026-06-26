"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, RotateCcw, UserCircle, X } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@punchless/ui/components/data-table";
import type { Database } from "@punchless/types/database.types";

import {
  createPost,
  recoverPost,
  softDeletePost,
  updatePost,
} from "@/lib/actions/post.actions";
import { useAction, toastAction } from "@/hooks/use-action";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];

interface Props {
  posts: PostRow[];
  summary: { totalPosts: number };
}

type ViewFilter = "active" | "deleted";

export function PostManager({ posts, summary }: Props) {
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editingPost, setEditingPost] = useState<PostRow | null>(null);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("active");

  const filteredPosts = useMemo(
    () =>
      posts.filter((post) =>
        viewFilter === "active" ? !post.is_deleted : post.is_deleted
      ),
    [posts, viewFilter]
  );

  const { execute: execCreate, loading: creating } = useAction(createPost, {
    successMessage: "Post created!",
    onSuccess: () => setMode("list"),
  });

  const { execute: execUpdate, loading: updating } = useAction(updatePost, {
    successMessage: "Post updated!",
    onSuccess: () => {
      setMode("list");
      setEditingPost(null);
    },
  });

  const { execute: execDelete, loading: deleting } = useAction(softDeletePost, {
    successMessage: "Post deleted",
  });

  const inputClass =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Posts"
        description="Job titles and positions assigned to employees (Mechanic, Supervisor, etc.)."
      >
        {mode === "list" ? (
          <Button onClick={() => setMode("add")}>
            <Plus className="size-4" /> Add Post
          </Button>
        ) : null}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard
          icon={UserCircle}
          label="Active posts"
          value={String(summary.totalPosts)}
        />
      </div>

      {mode !== "list" ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {mode === "add" ? "Add Post" : "Edit Post"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMode("list");
                setEditingPost(null);
              }}
            >
              <X className="size-4" />
            </Button>
          </div>

          <form
            action={mode === "add" ? execCreate : execUpdate}
            className="flex flex-wrap items-end gap-3"
          >
            {mode === "edit" && editingPost ? (
              <input type="hidden" name="postId" value={editingPost.id} />
            ) : null}
            <div className="min-w-[240px] flex-1">
              <label htmlFor="postName" className="mb-1 block text-sm font-medium">
                Post name
              </label>
              <input
                id="postName"
                name="name"
                required
                defaultValue={editingPost?.name ?? ""}
                placeholder="e.g. Mechanic"
                className={inputClass}
              />
            </div>
            <Button type="submit" loading={mode === "add" ? creating : updating} disabled={mode === "add" ? creating : updating}>
              {mode === "add" ? "Create" : "Save"}
            </Button>
          </form>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex gap-2">
          <Button
            variant={viewFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewFilter("active")}
          >
            Active
          </Button>
          <Button
            variant={viewFilter === "deleted" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewFilter("deleted")}
          >
            Deleted
          </Button>
        </div>

        <DataTable
          data={filteredPosts}
          getRowKey={(row) => row.id}
          enableSearch
          searchPlaceholder="Search posts…"
          searchFilter={(row, query) =>
            row.name.toLowerCase().includes(query)
          }
          emptyMessage="No posts yet."
          columns={[
            {
              key: "name",
              header: "Post name",
              cell: (row) => <span className="font-medium">{row.name}</span>,
            },
            {
              key: "actions",
              header: "Actions",
              cell: (row) => (
                <div className="flex gap-1">
                  {viewFilter === "active" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit"
                      onClick={() => {
                        setEditingPost(row);
                        setMode("edit");
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  ) : null}
                  {viewFilter === "active" ? (
                    <DeleteConfirmButton
                      entityName={row.name}
                      entityType="post"
                      loading={deleting}
                      onConfirm={async () => {
                        const fd = new FormData();
                        fd.set("postId", row.id);
                        await execDelete(fd);
                      }}
                    />
                  ) : (
                    <form action={toastAction(recoverPost, "Post recovered")}>
                      <input type="hidden" name="postId" value={row.id} />
                      <Button variant="ghost" size="icon" type="submit" title="Recover">
                        <RotateCcw className="size-4 text-primary" />
                      </Button>
                    </form>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserCircle;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="size-4" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}