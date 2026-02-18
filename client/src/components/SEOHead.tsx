import { Helmet } from "react-helmet-async";

export default function SEOHead({
  title,
  description,
  image,
  url,
  type = "website",
}: {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
}) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
    </Helmet>
  );
}
