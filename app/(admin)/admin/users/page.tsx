"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell, { useMe } from "@/components/PortalShell";
import { ErrorBox, Pill, Spinner, inputCls, inputStyle } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { ROLES, errMsg, roleLabel } from "@/lib/format";

const PAGE = 30;
type Result = { key: string; rows: any[]; hasMore: boolean; error: string };

function UsersList() {
  const me = useMe();
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [role, setRole] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const key = `${term}|${role}`;
  useEffect(() => {
    let cancelled = false;
    adminApi.users({ q: term || undefined, role: role || undefined, limit: PAGE, offset: 0 })
      .then(({ data }) => { if (!cancelled) setResult({ key, rows: data.data, hasMore: data.data.length === PAGE, error: "" }); })
      .catch((err) => { if (!cancelled) setResult({ key, rows: [], hasMore: false, error: errMsg(err, "Couldn't load users.") }); });
    return () => { cancelled = true; };
  }, [key, term, role]);

  const loading = !result || result.key !== key;
  const rows = loading ? [] : result!.rows;
  const error = actionError || (loading ? "" : result!.error);

  const loadMore = async () => {
    if (!result) return;
    setLoadingMore(true);
    try {
      const { data } = await adminApi.users({ q: term || undefined, role: role || undefined, limit: PAGE, offset: result.rows.length });
      setResult((r) => r && { ...r, rows: [...r.rows, ...data.data], hasMore: data.data.length === PAGE });
    } catch (err) {
      setActionError(errMsg(err, "Couldn't load more users."));
    } finally {
      setLoadingMore(false);
    }
  };

  const patchUser = async (u: any, data: { role?: string; isActive?: boolean }, confirmText: string) => {
    if (!window.confirm(confirmText)) return;
    setBusyId(u.id);
    setActionError("");
    try {
      const { data: res } = await adminApi.updateUser(u.id, data);
      setResult((r) => r && { ...r, rows: r.rows.map((x) => (x.id === u.id ? { ...x, ...res.data } : x)) });
    } catch (err) {
      setActionError(errMsg(err, "Couldn't update that user."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[220px] max-w-md">
          <label htmlFor="u-search" className="sr-only">Search users</label>
          <input id="u-search" type="search" value={q} onChange={(e) => { setActionError(""); setQ(e.target.value); }}
            placeholder="Search by name, email or phone…" className={inputCls} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="u-role" className="sr-only">Filter by role</label>
          <select id="u-role" value={role} onChange={(e) => { setActionError(""); setRole(e.target.value); }} className={inputCls} style={{ ...inputStyle, width: "auto" }}>
            <option value="">All roles</option>
            {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}
      {loading ? <Spinner label="Loading users..." /> : rows.length === 0 && !error ? (
        <p className="text-sm py-10 text-center" style={{ color: "var(--grey-500)" }}>No users match.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((u) => {
            const self = u.id === me.id;
            return (
              <div key={u.id} className="p-4 rounded-xl border flex items-center justify-between gap-4 flex-wrap" style={{ borderColor: "var(--grey-200)", background: "white", opacity: u.isActive ? 1 : 0.65 }}>
                <div className="min-w-0">
                  <div className="text-sm font-semibold" style={{ color: "var(--navy)" }}>
                    {u.firstName} {u.lastName} {self && <span className="font-normal" style={{ color: "var(--grey-400)" }}>(you)</span>}
                  </div>
                  <div className="text-xs break-all" style={{ color: "var(--grey-500)" }}>{u.email}</div>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {!u.isActive && <Pill tone="danger">Deactivated</Pill>}
                    {u.role !== "patient" && !u.staffId && <Pill tone="warn">No staff profile</Pill>}
                    {u.role === "doctor" && u.staffId && !u.doctorId && <Pill tone="warn">No doctor profile</Pill>}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <label className="sr-only" htmlFor={`role-${u.id}`}>Role for {u.firstName}</label>
                  <select id={`role-${u.id}`} value={u.role} disabled={self || busyId === u.id}
                    onChange={(e) => patchUser(u, { role: e.target.value }, `Change ${u.firstName}'s role to ${roleLabel(e.target.value)}?`)}
                    className="px-3 py-2 rounded-lg border text-xs font-semibold outline-none disabled:opacity-60" style={{ borderColor: "var(--grey-200)", color: "var(--navy)", background: "white" }}>
                    {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <button onClick={() => patchUser(u, { isActive: !u.isActive }, u.isActive ? `Deactivate ${u.firstName}? They will no longer be able to sign in.` : `Reactivate ${u.firstName}?`)}
                    disabled={self || busyId === u.id} className="px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                    style={u.isActive ? { background: "#fde8e8", color: "var(--danger)" } : { background: "var(--teal-light)", color: "var(--teal-dark)" }}>
                    {u.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                  <Link href={`/admin/users/${u.id}`} className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--teal)" }}>Manage</Link>
                </div>
              </div>
            );
          })}
          {result?.hasMore && (
            <div className="text-center pt-4">
              <button onClick={loadMore} disabled={loadingMore} className="px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60" style={{ background: "var(--grey-200)", color: "var(--navy)" }}>
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <PortalShell audience="admin" title={<>Users &amp; <em className="italic" style={{ color: "var(--teal)" }}>Roles</em></>} subtitle="Give people roles, deactivate accounts, and set up staff and doctor profiles">
      <UsersList />
    </PortalShell>
  );
}
