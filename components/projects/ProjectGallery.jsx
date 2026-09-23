"use client";

import { useEffect, useRef, useState } from "react";
import ProjectCard from "@/components/projects/ProjectCard";
import { projects } from "@/data/projects";
import { tags } from "@/data/tags";
import { slugify } from "@/lib/format";

// Below sm the grid becomes a single swipeable row: cards snap to the gutter
// and the next one peeks in from the edge. The cards themselves don't change,
// only how they're laid out. From sm up it's the usual grid again.
const ProjectGallery = ({ className = "", tags: selectedTags = [] }) => {
    const filtered = selectedTags.length > 0
        ? projects.filter((p) => p.tags.some((t) => selectedTags.includes(t)))
        : projects;

    const scrollerRef = useRef(null);
    const [active, setActive] = useState(0);

    // Which card is snapped. The last card can't reach snap-start (it's
    // narrower than the viewport), so being at the end of the track counts
    // as being on it.
    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        let frame = 0;
        const update = () => {
            frame = 0;
            const cards = [...el.children];
            if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
                setActive(cards.length - 1);
                return;
            }
            // Offsets are relative to the scroller (it's `relative`); they all
            // carry the same left padding, so it cancels out of the comparison.
            const dist = (card) => Math.abs(card.offsetLeft - el.scrollLeft);
            let nearest = 0;
            cards.forEach((card, i) => { if (dist(card) < dist(cards[nearest])) nearest = i; });
            setActive(nearest);
        };
        const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
        update();
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            el.removeEventListener("scroll", onScroll);
            cancelAnimationFrame(frame);
        };
    }, [filtered.length]);

    const goTo = (i) => {
        const card = scrollerRef.current?.children[i];
        if (!card) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        // Respects scroll-pl-4, so the card lands on the gutter like a swipe would.
        card.scrollIntoView({ inline: "start", block: "nearest", behavior: reduce ? "auto" : "smooth" });
    };

    return (
        <div className={className}>
            {filtered.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-10 w-full">
                    no projects match the selected tags
                </p>
            )}
            {/* -mx-4 undoes main's gutter so cards slide off the real screen
                edge; pb-3 leaves room for the card shadow, which overflow-x
                would otherwise clip. */}
            <div
                ref={scrollerRef}
                className="no-scrollbar relative flex gap-4 -mx-4 px-4 pb-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-pl-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible"
            >
                {filtered.map((project) => (
                    <ProjectCard
                        key={project.id}
                        id={slugify(project.title)}
                        className="w-[85%] shrink-0 snap-start sm:w-auto"
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
            {filtered.length > 1 && (
                <div className="flex justify-center mt-1 sm:hidden">
                    {filtered.map((project, i) => (
                        <button
                            key={project.id}
                            onClick={() => goTo(i)}
                            aria-label={`show ${project.title}`}
                            aria-current={i === active ? "true" : undefined}
                            className="p-1.5"
                        >
                            <span
                                aria-hidden="true"
                                className={`block w-1.5 h-1.5 rounded-full transition-colors ${i === active ? "bg-black" : "bg-gray-300"}`}
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectGallery;
