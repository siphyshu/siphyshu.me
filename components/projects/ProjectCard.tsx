"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { FaGithub } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { tagColorVariants, type Tag } from "@/data/tags";
import { tagSearchHref } from "@/lib/tags";
import { PencilMark, useHashMark } from "@/components/ui/PencilMark";

const THUMB_BOX = "flex items-center justify-center w-full relative aspect-[1.91/1]";

interface ProjectCardProps {
  /** Anchor id, so /projects#<id> (and the search palette) can point here. */
  id?: string;
  title: string;
  description: string;
  thumbnail?: string;
  links?: Record<string, string>;
  tags?: Tag[];
  /** The project's own page, once it has a write-up. */
  href?: string | null;
  className?: string;
}

export default function ProjectCard({
  id,
  title,
  description,
  thumbnail = "/thumbnails/projects/placeholder-thumbnail.png",
  links = {},
  tags = [],
  href = null,
  className = "",
}: ProjectCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mark = useHashMark(id, ref);

  const iconMap: Record<string, React.ReactNode> = {
    external: (
      <Image
        src="/icons/external_link.svg"
        alt="External Link"
        width={18}
        height={18}
        className="cursor-pointer dark:invert"
      />
    ),
    github: <FaGithub className="text-gray-800 text-2xl cursor-pointer" />,
  };

  const image = (
    <Image
      src={thumbnail}
      alt="Project Image"
      fill
      className="w-full h-full object-fill dark:brightness-[0.85]"
    />
  );

  return (
    <div ref={ref} id={id} data-card className={`relative flex flex-col bg-white border border-black shadow-md ${className}`}>
      {mark > 0 && <PencilMark key={mark} />}
      {/* Project Thumbnail — the way into the project's page, when it has
          one. Out of the tab order: the title is the same link. */}
      {href ? (
        <Link href={href} className={THUMB_BOX} tabIndex={-1} aria-hidden>
          {image}
        </Link>
      ) : (
        <div className={THUMB_BOX}>{image}</div>
      )}

      {/* Project Content */}
      <div className="font-serif p-4">
        <div className="flex justify-between items-center gap-3">
          {/* Title */}
          <h2 className="text-black prose prose-lg min-w-0 break-words">
            {href ? (
              <Link href={href} className="no-underline hover:underline underline-offset-[3px]">
                {title}
              </Link>
            ) : (
              title
            )}
          </h2>
          {/* Links */}
          {/* Two icons at most: the code and the live thing. Any other link
              (docs, say) is only on the project's page, where links are
              written out. p-2 -m-2 grows each hit area to finger size without
              moving the icons; neighbours overlap a little, the later one wins. */}
          <div className="flex items-center gap-2 shrink-0">
            {/* In iconMap's order, not the file's, so every card matches. */}
            {Object.keys(iconMap)
              .filter((key) => links[key])
              .map((key) => (
                <a key={key} href={links[key]} target="_blank" rel="noopener noreferrer" aria-label={key} className="p-2 -m-2">
                  {iconMap[key]}
                </a>
              ))}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-2">
          {tags
            .filter(Boolean)
            .map((tag, index) => (
              // A plain <a>, not next/link: a same-page hash change has to
              // fire hashchange for the palette to hear it.
              <a
                key={index}
                href={tagSearchHref(tag)}
                className={`px-2 py-1 text-[10px] border rounded-full ${tagColorVariants[tag.color]} ${tag.special ? "relative pl-4 bg-emerald-100 dark:bg-emerald-950" : ""}`}
              >
                {tag.special && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                )}
                {tag.name}
              </a>
            ))}
        </div>

        {/* Description */}
        <div className="text-gray mt-4 line-clamp-3 overflow-hidden prose prose-sm">
          <ReactMarkdown>{description}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
