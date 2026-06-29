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
      // keep original if bg removal fails
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

  const showForm = identified || preview;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Add item</h1>
        <p className="text-sm text-stone-400 mt-1">
          Take a photo — AI identifies everything automatically.
        </p>
      </div>

      <div className={`${showForm && preview ? "lg:grid lg:grid-cols-2 lg:gap-6" : ""}`}>
        {/* Left: Photo */}
        <div className="flex flex-col gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {preview ? (
            <div className="relative rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-sm">
              <Image
                src={preview}
                alt="Item preview"
                width={600}
                height={500}
                className="w-full h-72 lg:h-80 object-contain bg-stone-50"
              />
              {removingBg && (
                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-stone-200 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-sm font-medium text-stone-600">Removing background…</span>
                </div>
              )}
              <button
                onClick={() => { setPreview(null); setFile(null); setIdentified(false); }}
                className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-xs backdrop-blur-sm transition-colors"
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-64 lg:h-80 rounded-2xl border-2 border-dashed border-stone-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 flex flex-col items-center justify-center gap-3 text-stone-400 hover:text-indigo-500 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-xl bg-stone-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="1" y="5" width="20" height="15" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="11" cy="13" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 5l1.5-3h3L14 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Take photo or upload</p>
                <p className="text-xs text-stone-400 mt-0.5">AI will identify the item</p>
              </div>
            </button>
          )}

          {preview && !identified && (
            <button
              onClick={handleIdentify}
              disabled={identifying || removingBg}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 active:scale-[0.98] transition-all shadow-md shadow-indigo-900/20 flex items-center justify-center gap-2"
            >
              {identifying ? (
                <>
                  <span className="w-4 h-4 border border-indigo-300 border-t-white rounded-full animate-spin" />
                  Identifying…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1l1.5 3.5L13 6l-2.5 2.5L11 12l-3-1.5L5 12l.5-3.5L3 6l3.5-1.5L8 1Z" stroke="white" strokeWidth="1.25" strokeLinejoin="round"/>
                  </svg>
                  Identify with AI
                </>
              )}
            </button>
          )}
        </div>

        {/* Right: Form */}
        {showForm && (
          <form onSubmit={handleSave} className="flex flex-col gap-4 mt-4 lg:mt-0">
            {identified && (
              <div className="flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-indigo-500 shrink-0">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.25"/>
                  <path d="M4.5 7l2 2L9.5 5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-xs font-medium text-indigo-700">AI identified — review and edit below</p>
              </div>
            )}

            <Field label="Name *">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Vintage Levi's Jacket"
                className={inputCls}
              />
            </Field>

            <Field label="Location">
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Attic shelf 2"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Condition">
                <select
                  value={form.condition}
                  onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                  className={inputCls}
                >
                  {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Est. Value ($)">
                <input
                  type="number"
                  value={form.estimatedValue || ""}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedValue: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Category">
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Clothing, Electronics"
                className={inputCls}
              />
            </Field>

            <Field label="Description">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe the item…"
                className={`${inputCls} resize-none`}
              />
            </Field>

            <details className="group">
              <summary className="text-xs font-medium text-stone-400 uppercase tracking-widest cursor-pointer hover:text-stone-600 list-none flex items-center gap-1.5 select-none">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="group-open:rotate-90 transition-transform"
                >
                  <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                eBay listing details
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(["brand", "model", "color", "material", "size"] as const).map((key) => (
                  <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
                    <input
                      type="text"
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className={inputCls}
                    />
                  </Field>
                ))}
              </div>
            </details>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !form.name}
              className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 active:scale-[0.98] transition-all shadow-md shadow-indigo-900/20 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border border-indigo-300 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                "Save to catalog"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
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
