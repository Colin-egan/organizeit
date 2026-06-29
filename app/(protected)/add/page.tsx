"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { removeBackground } from "@imgly/background-removal";

type AiResult = {
  name: string;
  category: string;
  description: string;
  condition: string;
  brand: string;
  model: string;
  color: string;
  material: string;
  size: string;
  estimatedValue: number;
};

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

export default function AddPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<AiResult & { location: string }>({
    name: "", category: "", description: "", condition: "Good",
    brand: "", model: "", color: "", material: "", size: "",
    estimatedValue: 0, location: "",
  });
  const [identified, setIdentified] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setIdentified(false);
    setError("");
    setRemovingBg(true);
    try {
      const transparentBlob = await removeBackground(f);
      const processedFile = await compositeOnWhite(transparentBlob);
      setFile(processedFile);
      setPreview(URL.createObjectURL(processedFile));
    } catch {
      // If bg removal fails, keep original image
    } finally {
      setRemovingBg(false);
    }
  }

  async function handleIdentify() {
    if (!file) return;
    setIdentifying(true);
    setError("");

    try {
      const { base64, mimeType } = await fileToBase64(file);
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      if (!res.ok) throw new Error("Identification failed");
      const result: AiResult = await res.json();
      setForm((f) => ({ ...f, ...result }));
      setIdentified(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIdentifying(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSaving(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("item-photos")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("item-photos")
        .getPublicUrl(path);

      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photoUrl: publicUrl }),
      });
      if (!res.ok) throw new Error("Failed to save item");
      const item = await res.json();
      router.push(`/items/${item.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSaving(false);
    }
  }

  function field(key: keyof typeof form, label: string, type = "text") {
    return (
      <div key={key}>
        <label className="block text-sm font-medium text-zinc-700 mb-1">{label}</label>
        <input
          type={type}
          value={form[key] as string}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value,
            }))
          }
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Add Item</h1>

      {/* Photo section */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
        <p className="text-sm font-medium text-zinc-700 mb-3">Photo</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {preview ? (
          <div className="relative">
            <Image
              src={preview}
              alt="Item preview"
              width={600}
              height={400}
              className="w-full h-64 object-contain rounded-xl bg-white"
            />
            {removingBg && (
              <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-xl gap-2">
                <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-zinc-700">Removing background…</span>
              </div>
            )}
            <button
              onClick={() => { setPreview(null); setFile(null); setIdentified(false); }}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-black/70"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-48 rounded-xl border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:border-zinc-400 hover:text-zinc-500 transition-colors"
          >
            <span className="text-4xl">📷</span>
            <span className="text-sm font-medium">Tap to take photo or upload</span>
          </button>
        )}

        {preview && !identified && (
          <button
            onClick={handleIdentify}
            disabled={identifying || removingBg}
            className="mt-4 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {identifying ? "Identifying…" : "Identify with AI"}
          </button>
        )}
      </div>

      {/* Form section — shown after identification or can be filled manually */}
      {(identified || preview) && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col gap-4">
          <p className="text-sm font-medium text-zinc-700">
            {identified ? "Review and edit details" : "Fill in details manually"}
          </p>

          {field("name", "Name *")}
          {field("location", "Location (e.g. Garage shelf 2)")}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Condition</label>
            <select
              value={form.condition}
              onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            >
              {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {field("estimatedValue", "Estimated Value ($)", "number")}
          {field("category", "Category")}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 resize-none"
            />
          </div>

          <details className="group">
            <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-700 list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
              eBay aspects (brand, model, color…)
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {field("brand", "Brand")}
              {field("model", "Model")}
              {field("color", "Color")}
              {field("material", "Material")}
              {field("size", "Size")}
            </div>
          </details>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving || !form.name}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save to catalog"}
          </button>
        </form>
      )}
    </div>
  );
}

function compositeOnWhite(blob: Blob): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((b) => {
        if (!b) { reject(new Error("Canvas toBlob failed")); return; }
        resolve(new File([b], "photo.jpg", { type: "image/jpeg" }));
      }, "image/jpeg", 0.92);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      // Scale down to max 1600px on longest side to keep payload manageable
      const MAX = 1600;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const scale = MAX / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
    };
    img.onerror = reject;
    img.src = url;
  });
}
