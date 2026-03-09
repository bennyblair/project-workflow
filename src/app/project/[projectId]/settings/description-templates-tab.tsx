"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getDescriptionTemplates,
  createDescriptionTemplate,
  updateDescriptionTemplate,
  deleteDescriptionTemplate,
  type DescriptionTemplateItem,
} from "@/actions/description-templates";

type Props = { projectId: string };

export function DescriptionTemplatesTab({ projectId }: Props) {
  const [templates, setTemplates] = useState<DescriptionTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New template form
  const [newName, setNewName] = useState("");
  const [newBody, setNewBody] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTemplates = async () => {
    const data = await getDescriptionTemplates(projectId);
    setTemplates(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, [projectId]);

  const handleCreate = async () => {
    if (!newName.trim() || !newBody.trim()) return;
    setCreating(true);
    await createDescriptionTemplate(projectId, newName, newBody);
    setNewName("");
    setNewBody("");
    setCreating(false);
    fetchTemplates();
  };

  const startEdit = (t: DescriptionTemplateItem) => {
    setEditingId(t.id);
    setEditName(t.name);
    setEditBody(t.body);
  };

  const handleSave = async () => {
    if (!editingId || !editName.trim() || !editBody.trim()) return;
    setSaving(true);
    await updateDescriptionTemplate(editingId, editName, editBody);
    setEditingId(null);
    setSaving(false);
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    await deleteDescriptionTemplate(id);
    fetchTemplates();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Create standard description templates that can be imported when editing a
        ticket description.
      </p>

      {/* Create form */}
      <div className="space-y-3 rounded-md border p-4">
        <h3 className="text-sm font-semibold">New Template</h3>
        <Input
          placeholder="Template name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <textarea
          className="min-h-[120px] w-full rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Template body…"
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
        />
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={creating || !newName.trim() || !newBody.trim()}
        >
          {creating ? "Creating…" : "Create Template"}
        </Button>
      </div>

      {/* Existing templates */}
      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No description templates yet.
        </p>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-md border p-4 space-y-2">
              {editingId === t.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <textarea
                    className="min-h-[120px] w-full rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      {saving ? "Saving…" : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{t.name}</h4>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => startEdit(t)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDelete(t.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <pre className="max-h-[200px] overflow-auto rounded-md bg-muted/30 p-3 text-xs whitespace-pre-wrap">
                    {t.body}
                  </pre>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
