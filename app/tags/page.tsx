import { notFound } from "next/navigation";
import TagShowcase from "./TagShowcase";

// A palette playground for eyeballing tag colors while editing data/tags.ts —
// useful locally, but not part of the site. Kept in the repo (it's handy and
// it's how new tag colors get checked) and 404'd in production rather than
// deleted or gitignored.
//
// The check runs at build time, so the route is simply never generated for a
// production deploy.
export default function TagsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <TagShowcase />;
}
