import { archivedProjects } from "@/lib/projects";

// The archive: older and smaller things, kept but not featured. A plain list
// rather than more cards, so it reads as a footnote to the grid above it —
// one line each, no pictures, no pages, just where to find the thing.

// Descriptions allow the odd _(aside)_; here it's plain text.
const plain = (s) => s.replace(/[_*`]/g, "");

const ProjectArchive = ({ tags: selectedTags = [] }) => {
    const filtered = selectedTags.length > 0
        ? archivedProjects.filter((p) => p.tags.some((t) => selectedTags.includes(t)))
        : archivedProjects;
    if (filtered.length === 0) return null;

    return (
        <section className="mt-16">
            <h2 className="font-sans text-[0.9rem] text-gray-500 pb-2 border-b border-black">archive</h2>
            <ul>
                {filtered.map((project) => (
                    <li
                        key={project.slug}
                        id={project.slug}
                        className="grid sm:grid-cols-[13rem_1fr_auto] gap-x-6 gap-y-0.5 py-3 border-b border-[var(--rule)] last:border-b-0"
                    >
                        <span className="font-serif text-[1.02rem] text-black">{project.title}</span>
                        <span className="text-[0.92rem] leading-snug text-gray-500 sm:truncate">
                            {plain(project.description)}
                        </span>
                        <span className="flex gap-3 font-sans text-[0.85rem] mt-1 sm:mt-0">
                            {Object.entries(project.links).map(([key, url]) => (
                                <a
                                    key={key}
                                    href={url}
                                    target={url.startsWith("/") ? undefined : "_blank"}
                                    rel={url.startsWith("/") ? undefined : "noopener noreferrer"}
                                    className="text-gray-500 hover:text-black whitespace-nowrap"
                                >
                                    {key === "external" ? "site" : key} ↗
                                </a>
                            ))}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default ProjectArchive;
