"use client";

import Image from "next/image";
import { FaGithub } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { tagColorVariants, type Tag } from "@/data/tags";

interface ProjectCardProps {
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
  const iconMap: Record<string, React.ReactNode> = {
    github: <FaGithub className="text-gray-800 text-2xl cursor-pointer" />,
    external: (
      <Image
        src="/icons/external_link.svg"
        alt="External Link"
        width={18}
        height={18}
        className="cursor-pointer"
      />
    ),
  };

  return (
    <div className="flex flex-col bg-white border border-black shadow-md min-w-[250px]">
      {/* Project Thumbnail */}
      <div className="flex items-center justify-center w-full relative aspect-[1.91/1]">
        <Image
          src={thumbnail}
          alt="Project Image"
          fill
          className="w-full h-full object-fill"
        />
      </div>

      {/* Project Content */}
      <div className="font-serif p-4">
        <div className="flex justify-between items-center">
          {/* Title */}
          <h2 className="text-black prose prose-lg">{title}</h2>
          {/* Links */}
          <div className="flex items-center gap-2">
            {Object.entries(links).map(([key, url]) => (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer">
                {iconMap[key] || (
                  <span className="text-gray-800 text-sm cursor-pointer">
                    {key}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-2 mt-2">
          {tags
            .filter(Boolean)
            .map((tag, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-[10px] border rounded-full ${tagColorVariants[tag.color]} ${tag.special ? "relative pl-4 bg-emerald-100" : ""}`}
              >
                {tag.special && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                )}
                {tag.name}
              </span>
            ))}
        </div>

        {/* Description */}
        <div className="text-gray mt-4 line-clamp-3 overflow-hidden prose prose-sm text-justify">
          <ReactMarkdown>{description}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
