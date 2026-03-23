import { Helmet } from "react-helmet-async";
import {
  buildCanonical,
  buildPageTitle,
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
} from "@/lib/seo";

export default function SEOHead({
  title,
  description,
  image,
  pathname,
  type = "website",
  canonical,
  jsonLd,
  noindex = false,
}: {
  title: string;
  description?: string;
  image?: string;
  pathname?: string;
  type?: string;
  canonical?: string;
  jsonLd?: unknown;
  noindex?: boolean;
}) {
  const pageTitle = buildPageTitle(title);
  const pageDescription = description?.trim() || SITE_DESCRIPTION;
  const canonicalUrl = canonical || (pathname ? buildCanonical(pathname) : undefined);
  const pageImage = image || DEFAULT_OG_IMAGE || undefined;
  const robotsContent = noindex ? "noindex, nofollow" : "index, follow";

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="robots" content={robotsContent} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={SITE_LOCALE} />
      {pageImage && <meta property="og:image" content={pageImage} />}
      {pageImage && <meta property="og:image:alt" content={pageTitle} />}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta name="twitter:card" content={pageImage ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      {pageImage && <meta name="twitter:image" content={pageImage} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {!!jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
