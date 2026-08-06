"use client";

import Image from "next/image";
import ReactMarkdown from "react-markdown";
import type { Tag } from "@/data/tags";
import ProjectLinkIcons from "@/components/projects/ProjectLinkIcons";
import ProjectTags from "@/components/projects/ProjectTags";

export interface ProjectCardProps {
  title: string;
  description: string;
  thumbnail?: string;
  links?: Record<string, string>;
  tags?: Tag[];
}

export default function ProjectCard({
  title,
  description,
  thumbnail = "/thumbnails/projects/placeholder-thumbnail.png",
  links = {},
  tags = [],
}: ProjectCardProps) {
  return (
    <div className="flex flex-col bg-white border border-black shadow-md min-w-[250px]">
      {/* Project Thumbnail */}
      <div className="flex items-center justify-center w-full relative aspect-[1.91/1]">
        <Image
          src={thumbnail}
          alt="Project Image"
          fill
          className="w-full h-full object-cover"
        />
      </div>

      {/* Project Content */}
      <div className="font-serif p-4">
        <div className="flex justify-between items-center">
          {/* Title */}
          <h2 className="text-black prose prose-lg">{title}</h2>
          {/* Links */}
          <ProjectLinkIcons links={links} />
        </div>

        {/* Tags */}
        <div className="mt-2">
          <ProjectTags tags={tags} />
        </div>

        {/* Description */}
        <div className="text-gray mt-4 line-clamp-3 overflow-hidden prose prose-sm">
          <ReactMarkdown>{description}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
