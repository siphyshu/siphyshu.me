"use client";

import { useState } from "react";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectCardHorizontal from "@/components/projects/ProjectCardHorizontal";
import ProjectCardCompact from "@/components/projects/ProjectCardCompact";
import { projects } from "@/data/projects";
import { tags } from "@/data/tags";

type MobileVariant = "list" | "grid";

interface ProjectGalleryProps {
  className?: string;
}

const ProjectGallery = ({ className }: ProjectGalleryProps) => {
  const [mobileVariant, setMobileVariant] = useState<MobileVariant>("list");

  const resolvedProjects = projects.map((project) => ({
    ...project,
    links: project.links as Record<string, string>,
    resolvedTags: project.tags
      .map((tagId: string) => tags[tagId])
      .filter(Boolean),
  }));

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Mobile-only layout toggle — temporary, for comparing variants */}
      <div className="flex sm:hidden justify-end gap-1 mb-2">
        {(["list", "grid"] as const).map((variant) => (
          <button
            key={variant}
            onClick={() => setMobileVariant(variant)}
            className={`px-3 py-1 text-xs rounded-full border ${
              mobileVariant === variant
                ? "bg-black text-white border-black"
                : "text-gray-500 border-gray-300"
            }`}
          >
            {variant}
          </button>
        ))}
      </div>

      {/* Mobile */}
      <div className="sm:hidden">
        {mobileVariant === "list" ? (
          <div className="flex flex-col gap-3">
            {resolvedProjects.map((project) => (
              <ProjectCardHorizontal
                key={project.id}
                title={project.title}
                description={project.description}
                links={project.links}
                thumbnail={project.thumbnail}
                tags={project.resolvedTags}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {resolvedProjects.map((project) => (
              <ProjectCardCompact
                key={project.id}
                title={project.title}
                description={project.description}
                links={project.links}
                thumbnail={project.thumbnail}
                tags={project.resolvedTags}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden sm:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:grid-cols-3">
        {resolvedProjects.map((project) => (
          <ProjectCard
            key={project.id}
            title={project.title}
            description={project.description}
            links={project.links}
            thumbnail={project.thumbnail}
            tags={project.resolvedTags}
          />
        ))}
      </div>
    </div>
  );
};

export default ProjectGallery;
