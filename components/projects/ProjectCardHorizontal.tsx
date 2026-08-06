"use client";

import Image from "next/image";
import ReactMarkdown from "react-markdown";
import type { ProjectCardProps } from "@/components/projects/ProjectCard";
import ProjectLinkIcons from "@/components/projects/ProjectLinkIcons";
import ProjectTags from "@/components/projects/ProjectTags";

export default function ProjectCardHorizontal({
  title,
  description,
  thumbnail = "/thumbnails/projects/placeholder-thumbnail.png",
  links = {},
  tags = [],
}: ProjectCardProps) {
  return (
    <div className="flex gap-3 bg-white border border-black shadow-md p-2.5">
      {/* Thumbnail */}
      <div className="relative shrink-0 w-28 aspect-[1.91/1] overflow-hidden self-center">
        <Image
          src={thumbnail}
          alt="Project Image"
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="font-serif min-w-0 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <h2 className="text-black text-base leading-tight prose prose-lg">{title}</h2>
          <ProjectLinkIcons links={links} size="sm" />
        </div>

        <div className="mt-1">
          <ProjectTags tags={tags} size="sm" />
        </div>

        <div className="text-gray mt-1.5 text-sm line-clamp-2 overflow-hidden prose prose-sm">
          <ReactMarkdown>{description}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
