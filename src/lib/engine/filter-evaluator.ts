/**
 * Swimlane filter evaluator — evaluates AND/OR expression trees against ticket data.
 *
 * Expression format (from SPEC):
 * - Group:     { op: "AND" | "OR", children: Expr[] }
 * - Condition: { field: string, operator: string, value: string | string[] }
 * - Empty {}:  always matches (used for catch-all lanes)
 */

export type FilterCondition = {
  field: string;
  operator: "EQ" | "NEQ" | "CONTAINS" | "NOT_CONTAINS" | "IN";
  value: string | string[];
};

export type FilterGroup = {
  op: "AND" | "OR";
  children: FilterExpr[];
};

export type FilterExpr = FilterCondition | FilterGroup | Record<string, never>;

/** The ticket data shape we evaluate filters against. */
export type FilterContext = {
  typeId: string | null;
  teamId: string | null;
  assigneeId: string | null;
  status: string;
  title: string;
  description: string | null;
  /** For dot-notation fields like "type.key", "team.name", "assignee.name" */
  "type.key"?: string;
  "type.name"?: string;
  "team.name"?: string;
  "assignee.name"?: string;
  [key: string]: string | string[] | number | null | undefined;
};

function isGroup(expr: FilterExpr): expr is FilterGroup {
  return "op" in expr && "children" in expr;
}

function isCondition(expr: FilterExpr): expr is FilterCondition {
  return "field" in expr && "operator" in expr;
}

function isEmpty(expr: FilterExpr): boolean {
  return Object.keys(expr).length === 0;
}

function evaluateCondition(
  cond: FilterCondition,
  ctx: FilterContext,
): boolean {
  const fieldValue = ctx[cond.field];
  const target = cond.value;

  switch (cond.operator) {
    case "EQ":
      return String(fieldValue ?? "") === String(target);
    case "NEQ":
      return String(fieldValue ?? "") !== String(target);
    case "CONTAINS":
      return String(fieldValue ?? "")
        .toLowerCase()
        .includes(String(target).toLowerCase());
    case "NOT_CONTAINS":
      return !String(fieldValue ?? "")
        .toLowerCase()
        .includes(String(target).toLowerCase());
    case "IN":
      if (Array.isArray(target)) {
        return target.includes(String(fieldValue ?? ""));
      }
      return String(fieldValue ?? "") === String(target);
    default:
      return false;
  }
}

/**
 * Evaluate a filter expression tree against a ticket context.
 * Returns true if the ticket matches the filter.
 */
export function evaluateFilter(
  expr: FilterExpr,
  ctx: FilterContext,
): boolean {
  // Empty expression = match all (catch-all)
  if (isEmpty(expr)) return true;

  if (isGroup(expr)) {
    if (expr.op === "AND") {
      return expr.children.every((child) => evaluateFilter(child, ctx));
    }
    // OR
    return expr.children.some((child) => evaluateFilter(child, ctx));
  }

  if (isCondition(expr)) {
    return evaluateCondition(cond(expr), ctx);
  }

  // Legacy format: { type: "condition", field, operator, value }
  if ("type" in expr && (expr as Record<string, unknown>).type === "condition") {
    const legacy = expr as unknown as { field: string; operator: string; value: string | string[] };
    return evaluateCondition(
      { field: legacy.field, operator: legacy.operator.toUpperCase() as FilterCondition["operator"], value: legacy.value },
      ctx,
    );
  }

  return true; // Unknown format, treat as match
}

function cond(c: FilterCondition): FilterCondition {
  return c;
}

/**
 * Assign a ticket to the first matching swimlane, or null if none match.
 */
export function assignSwimlane(
  swimlanes: { id: string; filterExprJson: unknown; isCatchAll: boolean }[],
  ctx: FilterContext,
): string | null {
  for (const lane of swimlanes) {
    if (lane.isCatchAll) return lane.id;
    const expr = lane.filterExprJson as FilterExpr;
    if (evaluateFilter(expr, ctx)) return lane.id;
  }
  return null;
}
