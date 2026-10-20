/** Puts structured data in the page for search engines and AI assistants. "<" is escaped so the data can never close the script tag. */
export default function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
