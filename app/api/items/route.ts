import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("items")
    .insert({
      user_id: user.id,
      photo_url: body.photoUrl,
      thumbnail_url: body.photoUrl,
      name: body.name,
      category: body.category,
      description: body.description,
      condition: body.condition,
      estimated_value: body.estimatedValue || null,
      location: body.location,
      tags: body.tags || [],
      aspects: {
        brand: body.brand,
        model: body.model,
        color: body.color,
        material: body.material,
        size: body.size,
      },
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const location = searchParams.get("location") || "";
  const status = searchParams.get("status") || "";

  let query = supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("name", `%${search}%`);
  if (location) query = query.eq("location", location);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
