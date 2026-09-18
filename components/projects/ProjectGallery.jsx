"use client";

import ProjectCard from "@/components/projects/ProjectCard";
import { projects } from "@/data/projects";
import { tags } from "@/data/tags";

const ProjectGallery = ({ className = "", tags: selectedTags = [] }) => {
    const filtered = selectedTags.length > 0
        ? projects.filter((p) => p.tags.some((t) => selectedTags.includes(t)))
        : projects;

    return (
        <div className={`flex justify-start ${className}`}>
            {filtered.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-10 w-full">
                    no projects match the selected tags
                </p>
            )}
            <div className="grid gap-4 lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2">
                {filtered.map((project) => (
                    <ProjectCard
                        key={project.id}
                        title={project.title}
                        description={project.description}
                        links={project.links}
                        thumbnail={project.thumbnail}
                        tags={project.tags
                            .map((tagId) => tags[tagId]) // Map tag IDs to tag objects
                            .filter(Boolean)} // Exclude undefined tags
                    />
                ))}
            </div>
        </div>
    );
};

export default ProjectGallery;
