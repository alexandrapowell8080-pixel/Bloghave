import type { Metadata } from "next";

export type Crumb = { name: string; path: string };

export const SITE_NAME = "Bloghave";

export const SITE_KEYWORDS = [
  "Bloghave",
  "articles",
  "blog",
  "FAQ",
  "publishing",
  "writer byline",
  "content delivery",
  "Fellohtech",
];

export function siteOrigin() {
  return (process.env.BLOGHAVE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function absUrl(path: string) {
  if (!path) return siteOrigin();
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function metaDescription(text: string, fallback: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  const source = clean.length >= 40 ? clean : fallback;
  return source.length > 160 ? `${source.slice(0, 157).trim()}…` : source;
}

export function pageMeta({
  title,
  description,
  path,
  keywords = [],
  index = true,
  image,
  absolute = false,
  article,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  index?: boolean;
  image?: string | null;
  absolute?: boolean;
  article?: { publishedTime?: string | null; modifiedTime?: string | null; authors?: string[]; tags?: string[] };
}): Metadata {
  const keys = [...new Set([...keywords, ...SITE_KEYWORDS].map((item) => item.trim()).filter(Boolean))];
  const picture = image ? absUrl(image) : undefined;
  return {
    title: absolute ? { absolute: title } : title,
    description,
    keywords: keys,
    alternates: { canonical: path },
    robots: index
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } }
      : { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "en_GB",
      type: article ? "article" : "website",
      images: picture ? [{ url: picture, alt: title }] : undefined,
      publishedTime: article?.publishedTime || undefined,
      modifiedTime: article?.modifiedTime || undefined,
      authors: article?.authors,
      tags: article?.tags,
    },
    twitter: {
      card: picture ? "summary_large_image" : "summary",
      title,
      description,
      images: picture ? [picture] : undefined,
    },
  };
}

export function breadcrumbLd(crumbs: Crumb[]) {
  const page = absUrl(crumbs[crumbs.length - 1]?.path || "/");
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${page}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absUrl(crumb.path),
    })),
  };
}

export function websiteLd(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteOrigin()}#website`,
    name: SITE_NAME,
    url: siteOrigin(),
    description,
    inLanguage: "en",
    publisher: { "@id": `${siteOrigin()}#organization` },
  };
}

export function organizationLd(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteOrigin()}#organization`,
    name: SITE_NAME,
    url: siteOrigin(),
    description,
    brand: { "@type": "Brand", name: SITE_NAME },
    founder: { "@type": "Organization", name: "Fellohtech", url: "https://fellohtech.com" },
  };
}

export function itemListLd(name: string, path: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absUrl(path),
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absUrl(item.path),
    })),
  };
}

export function articleLd(post: {
  title: string;
  excerpt: string;
  slug: string;
  section: string;
  tags: string[];
  coverImage: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  wordCount: number;
  author: { name: string; role: string; bio: string };
}) {
  const path = `/blog/${post.slug}`;
  const image = post.coverImage ? absUrl(post.coverImage) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${absUrl(path)}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": absUrl(path) },
    headline: post.title,
    description: post.excerpt,
    image,
    articleSection: post.section || "Story",
    keywords: post.tags.join(", "),
    wordCount: post.wordCount,
    inLanguage: "en",
    dateCreated: post.createdAt,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
      jobTitle: post.author.role || undefined,
      description: post.author.bio || undefined,
    },
    publisher: { "@id": `${siteOrigin()}#organization` },
    breadcrumb: { "@id": `${absUrl(path)}#breadcrumb` },
  };
}

export function faqPageLd(questions: { title: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((question) => ({
      "@type": "Question",
      name: question.title,
      acceptedAnswer: { "@type": "Answer", text: question.answer },
    })),
  };
}

export function qaPageLd(post: {
  title: string;
  slug: string;
  answer: string;
  publishedAt: string | null;
  createdAt: string;
  authorName: string;
}) {
  const path = `/faq/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    "@id": absUrl(path),
    mainEntity: {
      "@type": "Question",
      name: post.title,
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        text: post.answer,
        datePublished: post.publishedAt || post.createdAt,
        author: { "@type": "Person", name: post.authorName },
      },
    },
  };
}
export function webPageLd(title: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": absUrl(path),
    name: title,
    description,
    url: absUrl(path),
    inLanguage: "en",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: siteOrigin() },
    breadcrumb: { "@id": `${absUrl(path)}#breadcrumb` },
  };
}
