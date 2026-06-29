import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const COLUMNS = [
  "id", "name", "category", "description", "condition",
  "estimated_value", "location", "status", "tags", "created_at",
];

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = Array.isArray(value) ? value.join("; ") : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("items")
    .select("id, name, category, description, condition, estimated_value, location, status, tags, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((item) =>
    COLUMNS.map((col) => escapeCell((item as Record<string, unknown>)[col])).join(",")
  );

  const csv = [COLUMNS.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="catalog-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
