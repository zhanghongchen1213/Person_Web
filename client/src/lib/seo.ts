export const SITE_NAME = "鸿尘客的个人博客";
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.trim().replace(/\/$/, "") ||
  "https://zhcmqtt.top";
export const SITE_DESCRIPTION =
  "专注于嵌入式系统、机器人技术和深度学习的工程实践与技术分享。";
export const SITE_LOCALE = "zh_CN";
export const DEFAULT_OG_IMAGE = "";
export const AUTHOR_NAME = "鸿尘客";

export function buildCanonical(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE_URL}${normalizedPath}`;
}

export function buildPageTitle(title: string) {
  if (!title.trim()) {
    return SITE_NAME;
  }
  if (title.includes(SITE_NAME)) {
    return title;
  }
  return `${title} | ${SITE_NAME}`;
}

export function createWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "zh-CN",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/articles?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function createCollectionPageJsonLd(params: {
  name: string;
  description: string;
  url: string;
  totalItems: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: params.name,
    description: params.description,
    url: params.url,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: params.totalItems,
    },
  };
}

export function createBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
