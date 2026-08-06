import { tagColorVariants, type Tag } from "@/data/tags";

interface ProjectTagsProps {
  tags: Tag[];
  size?: "sm" | "md";
}

export default function ProjectTags({ tags, size = "md" }: ProjectTagsProps) {
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";
  const textSize = size === "sm" ? "text-[9px]" : "text-[10px]";

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.filter(Boolean).map((tag, index) => (
        <span
          key={index}
          className={`${padding} ${textSize} border rounded-full ${tagColorVariants[tag.color]} ${tag.special ? "relative pl-4 bg-emerald-100" : ""}`}
        >
          {tag.special && (
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          )}
          {tag.name}
        </span>
      ))}
    </div>
  );
}
