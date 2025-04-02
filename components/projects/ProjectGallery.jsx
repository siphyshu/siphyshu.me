"use client";

import ProjectCard from "@/components/projects/ProjectCard";
import { projects } from "@/data/projects";
import { tags } from "@/data/tags";

const ProjectGallery = ({ className }) => {
    return (
        <div className={`flex justify-start ${className}`}>
            <div className="grid lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2">
                {projects.map((project) => (
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