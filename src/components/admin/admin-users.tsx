"use client";

import { useEffect, useState } from "react";

import { ModerationConfirmSheet } from "@/components/admin/moderation-confirm-sheet";
import { PageLoader } from "@/components/loader";
import { fetchUsers, setUserStatus } from "@/lib/admin-api";
import type { AdminUser, ModerationReason } from "@/lib/admin-types";
import { readCookie } from "@/lib/browser-session";

type Action = "hide" | "suspend" | "block" | "restore" | null;

export function AdminUsersPage() {
  const token = readCookie("th_access");
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [action, setAction] = useState<Action>(null);
  const [pending, setPending] = useState(false);

  async function reload(query = q) {
    setUsers(await fetchUsers(token, query));
  }

  useEffect(() => {
    void reload()
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load users"))
      .finally(() => setLoading(false));
  }, [token]);

  async function confirm(input: { reason: ModerationReason; note: string }) {
    if (!selected || !action) return;
    setPending(true);
    try {
      await setUserStatus(token, selected.id, action, {
        ...input,
        restoreContent: action === "restore",
      });
      await reload();
      setAction(null);
      setSelected(null);
    } finally {
      setPending(false);
    }
  }

  if (loading) return <PageLoader label="Loading users" />;

  return (
    <div className="px-5 py-6 md:px-8">
      <h1 className="font-display text-3xl">Users</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Search travelers and creators. Hide, suspend, or block with an audit note.
      </p>
      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          void reload(q);
        }}
      >
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search email, username, name"
          className="h-11 w-full max-w-md rounded-xl border border-border bg-background px-3 text-sm"
        />
      </form>
      {error ? <p className="mt-4 text-sm text-primary">{error}</p> : null}
      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border">
        {users.map((user) => (
          <li key={user.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_auto]">
            <div>
              <p className="font-medium">
                {user.displayName}{" "}
                <span className="text-muted-foreground">@{user.username}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {user.email} · {user.role} · {user.status}
              </p>
              {user.role === "tcc" ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {user.stories} stories · {user.spots} finds · {user.itineraries} plans · {user.blogs}{" "}
                  blogs
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {user.status === "active" ? (
                <>
                  <ActionButton
                    label="Hide"
                    onClick={() => {
                      setSelected(user);
                      setAction("hide");
                    }}
                  />
                  <ActionButton
                    label="Suspend"
                    onClick={() => {
                      setSelected(user);
                      setAction("suspend");
                    }}
                  />
                  <ActionButton
                    label="Block"
                    tone="danger"
                    onClick={() => {
                      setSelected(user);
                      setAction("block");
                    }}
                  />
                </>
              ) : (
                <ActionButton
                  label="Restore"
                  onClick={() => {
                    setSelected(user);
                    setAction("restore");
                  }}
                />
              )}
            </div>
          </li>
        ))}
      </ul>

      <ModerationConfirmSheet
        open={Boolean(action && selected)}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
            setSelected(null);
          }
        }}
        title={
          action === "hide"
            ? `Hide @${selected?.username}`
            : action === "suspend"
              ? `Suspend @${selected?.username}`
              : action === "block"
                ? `Block @${selected?.username}`
                : `Restore @${selected?.username}`
        }
        description={
          action === "hide"
            ? "Profile leaves discovery. They can still sign in."
            : action === "suspend" || action === "block"
              ? "They cannot sign in. Public content will be unpublished."
              : "Restore login. Unpublished content from this action can be restored."
        }
        impact={
          selected && (action === "suspend" || action === "block")
            ? `${selected.stories} stories, ${selected.spots} finds, ${selected.itineraries} plans, ${selected.blogs} blogs, ${selected.hues} hues will be unpublished.`
            : undefined
        }
        confirmLabel={action === "restore" ? "Restore" : action ? action[0].toUpperCase() + action.slice(1) : "Confirm"}
        pending={pending}
        onConfirm={confirm}
      />
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium ${
        tone === "danger" ? "bg-primary text-primary-foreground" : "border border-border"
      }`}
    >
      {label}
    </button>
  );
}
