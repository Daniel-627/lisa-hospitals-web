"use client";

import { useEffect, useMemo, useState } from "react";
import { billingApi } from "@/lib/api";
import { inputCls, inputStyle } from "@/components/ui";
import { fmtKes } from "@/lib/format";

export const PRICE_CATEGORIES: [string, string][] = [
  ["consultation", "Consultation"], ["lab", "Laboratory"], ["radiology", "Radiology"], ["pharmacy", "Pharmacy"],
  ["ward", "Ward"], ["procedure", "Procedures"], ["other", "Other"],
];

export type PriceItem = { id: string; category: string; name: string; unitPrice: string; isActive: boolean };

/** Search the hospital price list and add a charge with one click. Staying out of the way when the list is empty. */
export default function PricePicker({ onPick }: { onPick: (item: PriceItem) => void }) {
  const [items, setItems] = useState<PriceItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  useEffect(() => {
    billingApi.prices().then(({ data }) => setItems(data.data)).catch(() => { setFailed(true); setItems([]); });
  }, []);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (items ?? []).filter((i) => (!cat || i.category === cat) && (!term || i.name.toLowerCase().includes(term))).slice(0, 60);
  }, [items, q, cat]);

  if (items && items.length === 0) {
    return <p className="text-xs" style={{ color: "var(--grey-400)" }}>{failed ? "The price list couldn't be loaded. You can still type charges by hand." : "No price list yet. Type charges by hand, or ask a billing officer to add prices."}</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} !w-64`} style={inputStyle} placeholder="Search the price list" aria-label="Search the price list" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputCls} !w-44`} style={inputStyle} aria-label="Price list category">
          <option value="">All categories</option>
          {PRICE_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="max-h-56 overflow-y-auto rounded-lg border divide-y" style={{ borderColor: "var(--grey-200)" }}>
        {items === null ? <p className="p-3 text-xs" style={{ color: "var(--grey-400)" }}>Loading prices...</p>
          : shown.length === 0 ? <p className="p-3 text-xs" style={{ color: "var(--grey-400)" }}>Nothing matches.</p>
          : shown.map((i) => (
            <button key={i.id} type="button" onClick={() => onPick(i)} className="w-full flex justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-black/5" style={{ color: "var(--navy)", borderColor: "var(--grey-200)" }}>
              <span>{i.name}</span><span className="shrink-0 font-semibold">{fmtKes(i.unitPrice)}</span>
            </button>
          ))}
      </div>
    </div>
  );
}
