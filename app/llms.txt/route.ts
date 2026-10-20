import { DEPARTMENTS, toUrlSlug } from "@/lib/departments";
import { HOSPITAL } from "@/lib/hospital";
import { DEFAULT_DESCRIPTION } from "@/lib/seo";
import { abs } from "@/lib/site";

// A short, plain-text guide for AI assistants (the llms.txt convention): who we are, the facts, and the pages that matter.
export const dynamic = "force-static";

export function GET() {
  const body = `# ${HOSPITAL.name}

> ${DEFAULT_DESCRIPTION}

${HOSPITAL.name} is a hospital in Kisumu, Kenya. It is open ${HOSPITAL.hours.replace(/^Open /, "").toLowerCase()}. Facts below are maintained by the hospital.

## Key facts
- Location: ${HOSPITAL.addressLines.join(", ")}
- Postal address: ${HOSPITAL.poBox}
- Phone (24/7): ${HOSPITAL.phoneDisplay}
- Email: ${HOSPITAL.email}
- Insurance: ${HOSPITAL.insurers.join(", ")}
- Referral: not required

## Pages
- [Home](${abs("/")}): overview of the hospital
- [Services and departments](${abs("/services")}): all ${DEPARTMENTS.length} departments
- [Doctors](${abs("/doctors")}): doctors and specialists, with their departments
- [About](${abs("/about")}): about the hospital and insurance
- [Contact and directions](${abs("/contact")}): phone, email, address, map
- [Frequently asked questions](${abs("/faq")}): hours, location, insurance, appointments, privacy
- [News and health tips](${abs("/news")}): articles from the hospital

## Departments
${DEPARTMENTS.map((d) => `- [${d.name}](${abs(`/services/${toUrlSlug(d.slug)}`)}): ${d.short}`).join("\n")}

## Optional
- [Full text for AI assistants](${abs("/llms-full.txt")}): the same information with every answer written out
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
