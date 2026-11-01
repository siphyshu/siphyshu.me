import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Served at /robots.txt. /backstage is left out on purpose: it already says
// noindex, and a Disallow would both hide that from crawlers and advertise
// a URL nothing links to.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
