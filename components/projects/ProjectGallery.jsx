import ProjectCard from "@/components/projects/ProjectCard";
import { resolveTags } from "@/lib/tags";

// A server component now: projects come from content/ via lib/content, read by
// whichever page renders this. It holds no state and never held any — the
// "use client" it used to carry was inherited from the page it lived in.
const ProjectGallery = ({ projects = [], className = "" }) => {
    return (
        <div className={`flex justify-start ${className}`}>
            <div className="grid gap-4 lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2">
                {projects.map((project) => (
                    <ProjectCard
                        key={project.slug}
                        title={project.title}
                        description={project.description}
                        links={project.links}
                        thumbnail={project.thumbnail}
                        tags={resolveTags(project.tags)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ProjectGallery;
