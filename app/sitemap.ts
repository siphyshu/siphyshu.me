import type { MetadataRoute } from "next";
import { allArticles } from "content-collections";
import { SITE_URL } from "@/lib/site";

// Served at /sitemap.xml. Drafts never reach allArticles in a production
// build, so nothing here has to filter them.

const SECTIONS = ["", "/articles", "/projects", "/ctfs", "/gallery"];

export default function sitemap(): MetadataRoute.Sitemap {
  const sections = SECTIONS.map((path) => ({ url: `${SITE_URL}${path}` }));

  // Only pages that are their own canonical: external posts have no page
  // here, and a repost with canonical_url belongs in the original's sitemap.
  const articles = allArticles
    .filter((a) => a.hosted && !a.canonical_url)
    .map((a) => ({ url: `${SITE_URL}${a.href}`, lastModified: a.date }));

  return [...sections, ...articles];
}
