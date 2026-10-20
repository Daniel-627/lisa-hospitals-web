import { DEPARTMENTS, toUrlSlug } from "@/lib/departments";
import { FAQS } from "@/lib/faqs";
import { HOSPITAL } from "@/lib/hospital";
import { DEFAULT_DESCRIPTION } from "@/lib/seo";
import { abs } from "@/lib/site";

// The long version of llms.txt: departments and every FAQ answer written out, so an assistant can answer from one fetch.
export const dynamic = "force-static";

export function GET() {
  const body = `# ${HOSPITAL.name}

> ${DEFAULT_DESCRIPTION}

Website: ${abs("/")}
Phone (24/7): ${HOSPITAL.phoneDisplay}
Email: ${HOSPITAL.email}
Address: ${HOSPITAL.addressLines.join(", ")} (${HOSPITAL.poBox})

## Departments
${DEPARTMENTS.map((d) => `### ${d.name}${d.is24 ? " (24 hours)" : ""}\n${d.blurb}\n${abs(`/services/${toUrlSlug(d.slug)}`)}`).join("\n\n")}

## Frequently asked questions
${FAQS.map((f) => `### ${f.q}\n${f.a}`).join("\n\n")}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
