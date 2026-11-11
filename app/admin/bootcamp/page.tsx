import type { Metadata } from "next";
import { ContentPage, PageHeading } from "@/components/admin/content-page";
import { listBootcampSignups } from "@/lib/admin/bootcamp";
import { BOOTCAMP_EXPERIENCE } from "@/lib/validation";

export const metadata: Metadata = { title: "Bootcamp sign-ups" };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
});

export default function BootcampAdminPage() {
  return (
    <ContentPage section="/admin/bootcamp">
      {async () => {
        const signups = await listBootcampSignups();
        return (
          <>
            <PageHeading
              title="Bootcamp sign-ups"
              intro={`${signups.length} ${signups.length === 1 ? "person has" : "people have"} registered at giftpost.co.uk/bootcamp.`}
            />
            {signups.length > 0 && (
              <p className="mt-4">
                <a
                  href="/admin/bootcamp/export"
                  className="inline-flex min-h-10 items-center rounded-full border border-ink/30 px-4 text-sm font-semibold hover:border-ink"
                >
                  Download as CSV
                </a>
              </p>
            )}
            {signups.length === 0 ? (
              <p className="mt-8 text-ink-muted">No sign-ups yet. Share giftpost.co.uk/bootcamp to get started.</p>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-lg border border-line-snow bg-white">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-snow text-ink-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Experience</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Wants to build</th>
                      <th scope="col" className="px-4 py-3 font-semibold">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signups.map((s) => (
                      <tr key={s.id} className="border-t border-line-snow align-top">
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className="px-4 py-3">
                          <a href={`mailto:${s.email}`} className="underline underline-offset-4">{s.email}</a>
                        </td>
                        <td className="px-4 py-3">{BOOTCAMP_EXPERIENCE[s.experience]}</td>
                        <td className="max-w-xs px-4 py-3 text-ink-muted">{s.goal ?? "—"}</td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink-muted">
                          {dateFormat.format(new Date(s.created_at))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        );
      }}
    </ContentPage>
  );
}
