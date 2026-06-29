import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import ExcelJS from "exceljs";

const DATA_COLUMNS = [
  { key: "id", header: "ID", width: 38 },
  { key: "name", header: "Name", width: 30 },
  { key: "category", header: "Category", width: 20 },
  { key: "description", header: "Description", width: 40 },
  { key: "condition", header: "Condition", width: 15 },
  { key: "estimated_value", header: "Est. Value", width: 12 },
  { key: "location", header: "Location", width: 20 },
  { key: "status", header: "Status", width: 15 },
  { key: "tags", header: "Tags", width: 25 },
  { key: "created_at", header: "Created At", width: 22 },
];

const IMAGE_COL = 1;
const IMAGE_WIDTH = 120;
const ROW_HEIGHT = 90;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("items")
    .select("id, name, category, description, condition, estimated_value, location, status, tags, created_at, photo_url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Catalog");

  sheet.columns = [
    { header: "Image", key: "image", width: Math.round(IMAGE_WIDTH / 7) },
    ...DATA_COLUMNS,
  ];

  // Bold header row
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).height = 20;

  const items = data ?? [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>;
    const rowNum = i + 2;

    const row = sheet.addRow({
      image: "",
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      condition: item.condition,
      estimated_value: item.estimated_value,
      location: item.location,
      status: item.status,
      tags: Array.isArray(item.tags) ? (item.tags as string[]).join("; ") : item.tags ?? "",
      created_at: item.created_at,
    });
    row.height = ROW_HEIGHT;

    const photoUrl = item.photo_url as string | null;
    if (photoUrl) {
      try {
        const res = await fetch(photoUrl);
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          const contentType = res.headers.get("content-type") ?? "image/jpeg";
          const ext = contentType.includes("png") ? "png" : contentType.includes("gif") ? "gif" : "jpeg";

          const imageId = workbook.addImage({ buffer, extension: ext as "jpeg" | "png" | "gif" });
          sheet.addImage(imageId, {
            tl: { col: IMAGE_COL - 1, row: rowNum - 1 },
            br: { col: IMAGE_COL, row: rowNum },
            editAs: "oneCell",
          });
        }
      } catch {
        // skip image if fetch fails
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="catalog-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
