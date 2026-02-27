/**
 * Color rule evaluator — evaluates AND/OR expression trees with stepIndex support.
 *
 * Expression format extends the filter format with numeric comparisons:
 * - { field: "stepIndex", operator: "GTE"|"LTE"|"GT"|"LT"|"EQ", value: number }
 *
 * Ordered list of rules; first match wins. Fallback to TicketType.defaultColorHex.
 */

export type ColorCondition = {
  field: string;
  operator: "EQ" | "NEQ" | "CONTAINS" | "NOT_CONTAINS" | "IN" | "GTE" | "LTE" | "GT" | "LT";
  value: string | string[] | number;
};

export type ColorGroup = {
  op: "AND" | "OR";
  children: ColorExpr[];
};

export type ColorExpr = ColorCondition | ColorGroup | Record<string, never>;

export type ColorContext = {
  typeId: string | null;
  teamId: string | null;
  assigneeId: string | null;
  status: string;
  title: string;
  description: string | null;
  stepIndex: number;
  "type.key"?: string;
  "type.name"?: string;
  "team.name"?: string;
  "assignee.name"?: string;
  [key: string]: string | string[] | number | null | undefined;
};

function isGroup(expr: ColorExpr): expr is ColorGroup {
  return "op" in expr && "children" in expr;
}

function isCondition(expr: ColorExpr): expr is ColorCondition {
  return "field" in expr && "operator" in expr;
}

function isEmpty(expr: ColorExpr): boolean {
  return Object.keys(expr).length === 0;
}

function evaluateCondition(cond: ColorCondition, ctx: ColorContext): boolean {
  const fieldValue = ctx[cond.field];
  const target = cond.value;

  // Numeric comparisons (for stepIndex etc.)
  if (typeof target === "number" || ["GTE", "LTE", "GT", "LT"].includes(cond.operator)) {
    const numVal = Number(fieldValue ?? 0);
    const numTarget = Number(target);
    switch (cond.operator) {
      case "GTE": return numVal >= numTarget;
      case "LTE": return numVal <= numTarget;
      case "GT":  return numVal > numTarget;
      case "LT":  return numVal < numTarget;
      case "EQ":  return numVal === numTarget;
      default: return false;
    }
  }

  // String comparisons
  switch (cond.operator) {
    case "EQ":
      return String(fieldValue ?? "") === String(target);
    case "NEQ":
      return String(fieldValue ?? "") !== String(target);
    case "CONTAINS":
      return String(fieldValue ?? "").toLowerCase().includes(String(target).toLowerCase());
    case "NOT_CONTAINS":
      return !String(fieldValue ?? "").toLowerCase().includes(String(target).toLowerCase());
    case "IN":
      if (Array.isArray(target)) {
        return target.includes(String(fieldValue ?? ""));
      }
      return String(fieldValue ?? "") === String(target);
    default:
      return false;
  }
}

function evaluateExpr(expr: ColorExpr, ctx: ColorContext): boolean {
  if (isEmpty(expr)) return true;

  if (isGroup(expr)) {
    if (expr.op === "AND") {
      return expr.children.every((child) => evaluateExpr(child, ctx));
    }
    return expr.children.some((child) => evaluateExpr(child, ctx));
  }

  if (isCondition(expr)) {
    return evaluateCondition(expr, ctx);
  }

  // Legacy format: { type: "condition", field, operator, value }
  if ("type" in expr && (expr as Record<string, unknown>).type === "condition") {
    const legacy = expr as unknown as { field: string; operator: string; value: string | string[] | number };
    return evaluateCondition(
      { field: legacy.field, operator: legacy.operator.toUpperCase() as ColorCondition["operator"], value: legacy.value },
      ctx,
    );
  }

  return true;
}

/**
 * Evaluate ordered color rules against a ticket context.
 * Returns the colorHex of the first matching rule, or the fallback color.
 */
export function evaluateColorRules(
  rules: { whenExprJson: unknown; colorHex: string }[],
  ctx: ColorContext,
  fallbackColor: string,
): string {
  for (const rule of rules) {
    const expr = rule.whenExprJson as ColorExpr;
    if (evaluateExpr(expr, ctx)) {
      return rule.colorHex;
    }
  }
  return fallbackColor;
}
