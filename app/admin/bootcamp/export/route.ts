import { NextResponse } from "next/server";
import { listBootcampSignups } from "@/lib/admin/bootcamp";
import { currentAdmin } from "@/lib/admin-auth";
import { BOOTCAMP_EXPERIENCE } from "@/lib/validation";

/** Quotes a CSV cell and stops spreadsheet formula injection (=, +, -, @). */
function cell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Bootcamp sign-ups as CSV, for admins only. */
export async function GET() {
  if (!(await currentAdmin())) return NextResponse.json({ error: "Sign in as an admin first." }, { status: 401 });
  try {
    const rows = await listBootcampSignups();
    const csv = [
      ["Name", "Email", "Experience", "Wants to build", "Registered (UTC)"].map(cell).join(","),
      ...rows.map((r) =>
        [r.name, r.email, BOOTCAMP_EXPERIENCE[r.experience], r.goal ?? "", r.created_at].map(cell).join(","),
      ),
    ].join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="bootcamp-signups.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[bootcamp-export] failed", err);
    return NextResponse.json({ error: "The export failed. Try again in a minute." }, { status: 500 });
  }
}
