"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { Icon } from "@/components/Icon";
import { uploadsApi } from "@/lib/api";
import { errMsg } from "@/lib/format";

export type UploadPurpose = "doctor_photo" | "news_cover" | "patient_document" | "radiology_image" | "radiology_report";

/**
 * Upload one file to Cloudinary and hand back its link. The server decides where the file goes, which file types are
 * allowed, and whether it is public (website pictures) or private (patient files, which never open without a signed
 * link from the server). The file goes straight from the browser to Cloudinary.
 */
export default function FileUpload({ purpose, value, onChange, onBusyChange, hint, id }: {
  purpose: UploadPurpose; value: string; onChange: (url: string) => void; onBusyChange?: (busy: boolean) => void; hint?: string; id?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const isPublicPicture = purpose === "doctor_photo" || purpose === "news_cover";
  const busy = progress !== null;

  const setBusy = (p: number | null) => { setProgress(p); onBusyChange?.(p !== null); };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    try {
      setBusy(0);
      const { data } = await uploadsApi.sign(purpose);
      const s = data.data;
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (!s.formats.includes(ext)) throw new Error(`Choose a ${s.formats.map((f: string) => f.toUpperCase()).join(", ")} file.`);
      if (file.size > s.maxBytes) throw new Error(`The file is too large. The limit is ${Math.round(s.maxBytes / 1024 / 1024)} MB.`);

      const form = new FormData();
      Object.entries(s.fields).forEach(([k, v]) => form.append(k, String(v)));
      form.append("file", file);
      // A plain axios call: the hospital's sign-in token must never be sent to Cloudinary.
      const res = await axios.post(s.uploadUrl, form, { onUploadProgress: (e) => setProgress(e.total ? Math.round((e.loaded / e.total) * 100) : 50) });
      const url = res.data?.secure_url;
      if (typeof url !== "string") throw new Error("The upload did not finish. Please try again.");
      setName(file.name);
      onChange(url);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || (err?.message && !err?.response ? err.message : errMsg(err, "The upload failed. Please try again.")));
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <input ref={input} id={id} type="file" className="sr-only" disabled={busy} onChange={(e) => pick(e.target.files?.[0])}
        accept={isPublicPicture ? "image/jpeg,image/png,image/webp" : purpose === "radiology_image" ? "image/jpeg,image/png,image/webp" : "application/pdf,image/jpeg,image/png,image/webp"} />
      <div className="flex items-center gap-3 flex-wrap">
        {value && isPublicPicture && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-16 w-16 rounded-lg object-cover border" style={{ borderColor: "var(--grey-200)" }} />
        )}
        {value && !isPublicPicture && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg" style={{ background: "var(--teal-light)", color: "var(--teal-dark)" }}>
            <Icon name="check" /> {name || "File attached"}
          </span>
        )}
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>
          {busy ? `Uploading ${progress}%` : value ? "Replace file" : "Choose file"}
        </button>
        {value && !busy && (
          <button type="button" onClick={() => { onChange(""); setName(""); }} className="text-sm font-medium" style={{ color: "var(--danger)" }}>Remove</button>
        )}
      </div>
      {error && <p className="text-xs mt-2" style={{ color: "var(--danger)" }}>{error}</p>}
      {hint && !error && <p className="text-xs mt-2" style={{ color: "var(--grey-400)" }}>{hint}</p>}
    </div>
  );
}
