"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell from "@/components/PortalShell";
import { PRICE_CATEGORIES, type PriceItem } from "@/components/PricePicker";
import { Card, ErrorBox, Field, Pill, Spinner, inputCls, inputStyle } from "@/components/ui";
import { billingApi } from "@/lib/api";
import { errMsg, fmtKes } from "@/lib/format";
import { Back } from "@/components/Icon";

function Prices() {
  const [items, setItems] = useState<PriceItem[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [edit, setEdit] = useState<{ id: string; value: string } | null>(null);
  const [form, setForm] = useState({ category: "lab", name: "", unitPrice: "" });
  const [busy, setBusy] = useState(false);

  const load = () => billingApi.prices({ all: true }).then(({ data }) => setItems(data.data)).catch((e) => { setError(errMsg(e, "Couldn't load the price list.")); setItems([]); });
  useEffect(() => { load(); }, []);

  const act = async (fn: () => Promise<unknown>, fallback: string) => {
    setError(""); setBusy(true);
    try { await fn(); await load(); return true; } catch (e) { setError(errMsg(e, fallback)); return false; } finally { setBusy(false); }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.unitPrice);
    if (!form.name.trim()) return setError("Give the item a name.");
    if (form.unitPrice.trim() === "" || !Number.isFinite(price) || price < 0) return setError("Enter a price (KES).");
    if (await act(() => billingApi.createPrice({ category: form.category, name: form.name.trim(), unitPrice: price }), "Couldn't add the item.")) setForm((f) => ({ ...f, name: "", unitPrice: "" }));
  };

  const savePrice = async () => {
    if (!edit) return;
    const price = Number(edit.value);
    if (edit.value.trim() === "" || !Number.isFinite(price) || price < 0) return setError("Enter a valid price.");
    if (await act(() => billingApi.updatePrice(edit.id, { unitPrice: price }), "Couldn't change the price.")) setEdit(null);
  };

  const term = q.trim().toLowerCase();
  const shown = (items ?? []).filter((i) => (!cat || i.category === cat) && (!term || i.name.toLowerCase().includes(term)));
  const label = (c: string) => PRICE_CATEGORIES.find(([v]) => v === c)?.[1] ?? c;

  return (
    <div className="max-w-3xl space-y-6">
      {error && <ErrorBox>{error}</ErrorBox>}
      <Card>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--navy)" }}>Add an item</h2>
        <form onSubmit={add} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-12 sm:col-span-3"><Field label="Category" htmlFor="pr-cat">
            <select id="pr-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} style={inputStyle}>
              {PRICE_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></Field></div>
          <div className="col-span-12 sm:col-span-5"><Field label="Name" htmlFor="pr-name">
            <input id="pr-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} style={inputStyle} maxLength={300} /></Field></div>
          <div className="col-span-8 sm:col-span-2"><Field label="Price (KES)" htmlFor="pr-price">
            <input id="pr-price" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} className={inputCls} style={inputStyle} inputMode="decimal" /></Field></div>
          <button type="submit" disabled={busy} className="col-span-4 sm:col-span-2 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--teal)" }}>Add</button>
        </form>
      </Card>

      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} !w-64`} style={inputStyle} placeholder="Search" aria-label="Search the price list" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputCls} !w-44`} style={inputStyle} aria-label="Category">
          <option value="">All categories</option>
          {PRICE_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {items === null ? <Spinner label="Loading prices..." /> : shown.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--grey-500)" }}>No items.</p>
      ) : (
        <div className="space-y-2">
          {shown.map((i) => (
            <Card key={i.id} className="!p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-sm font-semibold" style={{ color: "var(--navy)", opacity: i.isActive ? 1 : 0.5 }}>{i.name}</div>
                <div className="text-xs" style={{ color: "var(--grey-500)" }}>{label(i.category)} {!i.isActive && <Pill tone="muted">Switched off</Pill>}</div>
              </div>
              <div className="flex items-center gap-3">
                {edit?.id === i.id ? (
                  <>
                    <input aria-label={`New price for ${i.name}`} value={edit.value} onChange={(e) => setEdit({ id: i.id, value: e.target.value })} className={`${inputCls} !w-28 !py-2`} style={inputStyle} inputMode="decimal" autoFocus />
                    <button type="button" disabled={busy} onClick={savePrice} className="text-sm font-semibold" style={{ color: "var(--teal)" }}>Save</button>
                    <button type="button" onClick={() => setEdit(null)} className="text-sm" style={{ color: "var(--grey-500)" }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{fmtKes(i.unitPrice)}</span>
                    <button type="button" onClick={() => setEdit({ id: i.id, value: String(Number(i.unitPrice)) })} className="text-sm font-semibold" style={{ color: "var(--teal)" }}>Change</button>
                    <button type="button" disabled={busy} onClick={() => act(() => billingApi.updatePrice(i.id, { isActive: !i.isActive }), "Couldn't update the item.")} className="text-sm" style={{ color: "var(--grey-500)" }}>{i.isActive ? "Switch off" : "Switch on"}</button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      <p className="text-xs" style={{ color: "var(--grey-400)" }}>Changing a price only affects invoices raised from now on. Existing invoices keep the price they were raised at.</p>
    </div>
  );
}

export default function PricesPage() {
  return (
    <PortalShell audience="staff" title={<>Price <em className="italic" style={{ color: "var(--teal)" }}>List</em></>} subtitle="What the hospital charges for each service">
      <Link href="/staff/billing" className="text-sm font-semibold mb-4 inline-block" style={{ color: "var(--teal)" }}><Back />Billing desk</Link>
      <Prices />
    </PortalShell>
  );
}
