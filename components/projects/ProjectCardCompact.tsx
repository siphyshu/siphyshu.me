"use client";

import { useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import type { ProjectCardProps } from "@/components/projects/ProjectCard";
import ProjectLinkIcons from "@/components/projects/ProjectLinkIcons";
import ProjectTags from "@/components/projects/ProjectTags";

export default function ProjectCardCompact({
  title,
  description,
  thumbnail = "/thumbnails/projects/placeholder-thumbnail.png",
  links = {},
  tags = [],
}: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="flex flex-col bg-white border border-black shadow-md cursor-pointer"
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="relative w-full aspect-square">
        <Image
          src={thumbnail}
          alt="Project Image"
          fill
          className="object-cover"
        />
      </div>

      <div className="font-serif p-2.5">
        <div className="flex justify-between items-start gap-1.5">
          <h2 className="text-black text-sm leading-tight prose">{title}</h2>
          {expanded && <ProjectLinkIcons links={links} size="sm" />}
        </div>

        {expanded && (
          <>
            <div className="mt-1.5">
              <ProjectTags tags={tags} size="sm" />
            </div>
            <div className="text-gray mt-1.5 text-xs prose prose-sm">
              <ReactMarkdown>{description}</ReactMarkdown>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
