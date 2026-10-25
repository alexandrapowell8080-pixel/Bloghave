import type { MetadataRoute } from "next";
import { absUrl } from "@/lib/seo";
import { listPublicPosts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const stories = listPublicPosts("article");
  const faqs = listPublicPosts("faq");
  const stamp = (value: string | null) => (value ? new Date(value) : new Date());
  return [
    { url: absUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absUrl("/blog"), changeFrequency: "daily", priority: 0.9 },
    { url: absUrl("/faq"), changeFrequency: "daily", priority: 0.9 },
    ...stories.map((post) => ({
      url: absUrl(`/blog/${post.slug}`),
      lastModified: stamp(post.updatedAt || post.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...faqs.map((post) => ({
      url: absUrl(`/faq/${post.slug}`),
      lastModified: stamp(post.updatedAt || post.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
