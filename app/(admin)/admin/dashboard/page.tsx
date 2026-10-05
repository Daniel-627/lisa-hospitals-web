"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell from "@/components/PortalShell";
import { Card, ErrorBox, Spinner } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { errMsg, roleLabel } from "@/lib/format";

function Content() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminApi.stats()
      .then(({ data }) => { if (!cancelled) setStats(data.data); })
      .catch((err) => { if (!cancelled) setError(errMsg(err, "Couldn't load the dashboard.")); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!stats) return <Spinner label="Loading..." />;

  const cards = [
    { label: "Total users", value: stats.totalUsers, href: "/admin/users", icon: "👥" },
    { label: "Patients", value: stats.patients, href: "/staff/patients", icon: "🧑‍⚕️" },
    { label: "Pending appointments", value: stats.pendingAppointments, href: "/staff/appointments", icon: "⏳" },
    { label: "Unread messages", value: stats.unreadEnquiries, href: "/admin/enquiries", icon: "✉️", highlight: stats.unreadEnquiries > 0 },
    { label: "Published articles", value: stats.publishedPosts, href: "/admin/news", icon: "📰" },
    { label: "Draft articles", value: stats.draftPosts, href: "/admin/news", icon: "📝" },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="p-5 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5"
            style={{ borderColor: c.highlight ? "var(--teal)" : "var(--grey-200)", background: "white" }}>
            <div className="text-2xl mb-2" aria-hidden>{c.icon}</div>
            <div className="text-3xl font-bold mb-1" style={{ color: "var(--navy)", fontFamily: "var(--font-display)" }}>{c.value}</div>
            <div className="text-xs" style={{ color: "var(--grey-500)" }}>{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--navy)" }}>Users by role</h2>
          <div className="space-y-2">
            {Object.entries(stats.usersByRole as Record<string, number>).sort((a, b) => b[1] - a[1]).map(([role, n]) => (
              <div key={role} className="flex justify-between text-sm">
                <span style={{ color: "var(--navy)" }}>{roleLabel(role)}</span>
                <span className="font-semibold" style={{ color: "var(--grey-500)" }}>{n}</span>
              </div>
            ))}
          </div>
          <Link href="/admin/users" className="inline-block mt-4 text-sm font-semibold" style={{ color: "var(--teal)" }}>Manage users →</Link>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--navy)" }}>Quick actions</h2>
          <div className="space-y-2">
            {[["/admin/news/new", "Write a news article"], ["/admin/users", "Add a role to a user"], ["/admin/enquiries", "Read contact messages"], ["/admin/audit", "View the audit log"]].map(([href, label]) => (
              <Link key={href} href={href} className="block px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "var(--grey-100)", color: "var(--navy)" }}>{label}</Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

export default function AdminDashboard() {
  return (
    <PortalShell audience="admin" title={<>Admin <em className="italic" style={{ color: "var(--teal)" }}>Dashboard</em></>} subtitle="Manage users, content and messages">
      <Content />
    </PortalShell>
  );
}
