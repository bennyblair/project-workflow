"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { renameBoard, deleteBoard, type ActionState } from "@/actions/board";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BoardCardProps = {
  board: {
    id: string;
    name: string;
    ticketCount: number;
    maxSteps: number;
    refreshIntervalSeconds: number;
  };
};

const initialState: ActionState = { success: false };

export function BoardCard({ board }: BoardCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [renameState, renameAction, isRenaming] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await renameBoard(prev, formData);
      if (result.success) setIsEditing(false);
      return result;
    },
    initialState,
  );
  const [, deleteAction, isDeleting] = useActionState(deleteBoard, initialState);

  return (
    <Card className="relative">
      <CardHeader>
        {isEditing ? (
          <form action={renameAction} className="flex gap-2">
            <input type="hidden" name="id" value={board.id} />
            <Input
              name="name"
              defaultValue={board.name}
              required
              maxLength={100}
              className="h-8 text-sm"
              autoFocus
            />
            <Button type="submit" size="sm" disabled={isRenaming}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            {renameState.error && (
              <p className="text-xs text-destructive">{renameState.error}</p>
            )}
          </form>
        ) : (
          <>
            <Link href={`/board/${board.id}`}>
              <CardTitle className="hover:underline">{board.name}</CardTitle>
            </Link>
            <CardDescription>
              {board.ticketCount} ticket{board.ticketCount !== 1 && "s"} ·{" "}
              {board.maxSteps} steps · {board.refreshIntervalSeconds}s refresh
            </CardDescription>
          </>
        )}
        {!isEditing && (
          <div className="flex gap-2 pt-2">
            <Link href={`/board/${board.id}`}>
              <Button size="sm" variant="secondary">
                Open
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
            >
              Rename
            </Button>
            <Link href={`/settings/${board.id}`}>
              <Button size="sm" variant="ghost">
                Settings
              </Button>
            </Link>
            <form action={deleteAction}>
              <input type="hidden" name="id" value={board.id} />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </Button>
            </form>
          </div>
        )}
      </CardHeader>
    </Card>
  );
}
