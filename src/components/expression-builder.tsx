"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Types matching the spec's filter expression format ──────────────────────

type Condition = {
  field: string;
  operator: string;
  value: string | string[];
};

type Group = {
  op: "AND" | "OR";
  children: Expr[];
};

type Expr = Condition | Group | Record<string, never>;

// ── Field options ───────────────────────────────────────────────────────────

const FILTER_FIELDS = [
  { value: "typeId", label: "Type ID" },
  { value: "type.key", label: "Type Key" },
  { value: "teamId", label: "Team ID" },
  { value: "team.name", label: "Team Name" },
  { value: "assigneeId", label: "Assignee ID" },
  { value: "assignee.name", label: "Assignee Name" },
  { value: "status", label: "Status" },
  { value: "title", label: "Title" },
];

const COLOR_FIELDS = [
  ...FILTER_FIELDS,
  { value: "stepIndex", label: "Step Index" },
];

const STRING_OPERATORS = [
  { value: "EQ", label: "=" },
  { value: "NEQ", label: "≠" },
  { value: "CONTAINS", label: "contains" },
  { value: "NOT_CONTAINS", label: "not contains" },
  { value: "IN", label: "in" },
];

const NUMBER_OPERATORS = [
  { value: "EQ", label: "=" },
  { value: "NEQ", label: "≠" },
  { value: "GT", label: ">" },
  { value: "GTE", label: ">=" },
  { value: "LT", label: "<" },
  { value: "LTE", label: "<=" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function isGroup(expr: Expr): expr is Group {
  return "op" in expr && "children" in expr;
}

function isCondition(expr: Expr): expr is Condition {
  return "field" in expr && "operator" in expr;
}

function isEmpty(expr: Expr): boolean {
  return Object.keys(expr).length === 0;
}

function newCondition(): Condition {
  return { field: "typeId", operator: "EQ", value: "" };
}

function newGroup(): Group {
  return { op: "AND", children: [newCondition()] };
}

// ── Condition Editor ────────────────────────────────────────────────────────

function ConditionEditor({
  condition,
  onChange,
  onRemove,
  allowStepIndex,
}: {
  condition: Condition;
  onChange: (c: Condition) => void;
  onRemove: () => void;
  allowStepIndex: boolean;
}) {
  const fields = allowStepIndex ? COLOR_FIELDS : FILTER_FIELDS;
  const isNumericField = condition.field === "stepIndex";
  const operators = isNumericField ? NUMBER_OPERATORS : STRING_OPERATORS;

  return (
    <div className="flex items-center gap-1.5 rounded border bg-background p-1.5">
      <select
        value={condition.field}
        onChange={(e) => onChange({ ...condition, field: e.target.value })}
        className="h-7 rounded border bg-background px-1.5 text-xs"
      >
        {fields.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <select
        value={condition.operator}
        onChange={(e) => onChange({ ...condition, operator: e.target.value })}
        className="h-7 rounded border bg-background px-1.5 text-xs"
      >
        {operators.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Input
        value={
          Array.isArray(condition.value)
            ? condition.value.join(", ")
            : condition.value
        }
        onChange={(e) => {
          const raw = e.target.value;
          const val =
            condition.operator === "IN"
              ? raw.split(",").map((s) => s.trim())
              : raw;
          onChange({ ...condition, value: val });
        }}
        placeholder={condition.operator === "IN" ? "val1, val2" : "value"}
        className="h-7 w-32 text-xs"
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-destructive"
        onClick={onRemove}
      >
        ×
      </Button>
    </div>
  );
}

// ── Group Editor (recursive) ────────────────────────────────────────────────

function GroupEditor({
  group,
  onChange,
  onRemove,
  allowStepIndex,
  depth,
}: {
  group: Group;
  onChange: (g: Group) => void;
  onRemove?: () => void;
  allowStepIndex: boolean;
  depth: number;
}) {
  const updateChild = (index: number, expr: Expr) => {
    const next = [...group.children];
    next[index] = expr;
    onChange({ ...group, children: next });
  };

  const removeChild = (index: number) => {
    const next = group.children.filter((_, i) => i !== index);
    onChange({ ...group, children: next.length === 0 ? [newCondition()] : next });
  };

  const addCondition = () => {
    onChange({ ...group, children: [...group.children, newCondition()] });
  };

  const addSubGroup = () => {
    onChange({ ...group, children: [...group.children, newGroup()] });
  };

  const toggleOp = () => {
    onChange({ ...group, op: group.op === "AND" ? "OR" : "AND" });
  };

  return (
    <div
      className={`space-y-1.5 rounded-lg border p-2 ${
        depth > 0 ? "ml-4 border-dashed" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs font-bold"
          onClick={toggleOp}
        >
          {group.op}
        </Button>
        <span className="text-xs text-muted-foreground">
          group {depth > 0 ? `(depth ${depth})` : "(root)"}
        </span>
        {onRemove && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto h-6 px-1 text-xs text-destructive"
            onClick={onRemove}
          >
            Remove group
          </Button>
        )}
      </div>

      {group.children.map((child, i) => (
        <div key={i}>
          {isGroup(child) ? (
            <GroupEditor
              group={child}
              onChange={(g) => updateChild(i, g)}
              onRemove={() => removeChild(i)}
              allowStepIndex={allowStepIndex}
              depth={depth + 1}
            />
          ) : isCondition(child) ? (
            <ConditionEditor
              condition={child}
              onChange={(c) => updateChild(i, c)}
              onRemove={() => removeChild(i)}
              allowStepIndex={allowStepIndex}
            />
          ) : null}
        </div>
      ))}

      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-6 text-xs"
          onClick={addCondition}
        >
          + Condition
        </Button>
        {depth < 3 && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 text-xs"
            onClick={addSubGroup}
          >
            + Sub-group
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main Expression Builder ─────────────────────────────────────────────────

type Props = {
  value: unknown;
  onChange: (expr: unknown) => void;
  /** Allow stepIndex field (for color rules) */
  allowStepIndex?: boolean;
};

export function ExpressionBuilder({
  value,
  onChange,
  allowStepIndex = false,
}: Props) {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(value ?? {}, null, 2),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Parse value into our editable structure
  const expr = value as Expr;
  const rootGroup: Group = isGroup(expr)
    ? expr
    : isEmpty(expr)
      ? { op: "AND", children: [] }
      : isCondition(expr)
        ? { op: "AND", children: [expr] }
        : { op: "AND", children: [] };

  const handleVisualChange = useCallback(
    (g: Group) => {
      onChange(g);
      setJsonText(JSON.stringify(g, null, 2));
    },
    [onChange],
  );

  const handleJsonChange = useCallback(
    (text: string) => {
      setJsonText(text);
      try {
        const parsed = JSON.parse(text);
        setJsonError(null);
        onChange(parsed);
      } catch {
        setJsonError("Invalid JSON");
      }
    },
    [onChange],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={isAdvanced ? "outline" : "default"}
          className="h-6 text-xs"
          onClick={() => {
            if (isAdvanced) {
              // Switching back to visual — sync JSON
              try {
                const parsed = JSON.parse(jsonText);
                onChange(parsed);
                setJsonError(null);
              } catch {
                // Keep in advanced mode if JSON is invalid
                return;
              }
            } else {
              setJsonText(JSON.stringify(value ?? {}, null, 2));
            }
            setIsAdvanced(!isAdvanced);
          }}
        >
          {isAdvanced ? "Visual" : "Visual"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={isAdvanced ? "default" : "outline"}
          className="h-6 text-xs"
          onClick={() => {
            if (!isAdvanced) {
              setJsonText(JSON.stringify(value ?? {}, null, 2));
            }
            setIsAdvanced(!isAdvanced);
          }}
        >
          Advanced JSON
        </Button>
      </div>

      {isAdvanced ? (
        <div className="space-y-1">
          <textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="h-32 w-full rounded-md border bg-background p-2 font-mono text-xs"
            spellCheck={false}
          />
          {jsonError && (
            <p className="text-xs text-destructive">{jsonError}</p>
          )}
        </div>
      ) : (
        <GroupEditor
          group={rootGroup}
          onChange={handleVisualChange}
          allowStepIndex={allowStepIndex}
          depth={0}
        />
      )}
    </div>
  );
}
