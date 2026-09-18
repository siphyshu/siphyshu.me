"use client";

import Toolbar from "@/components/ui/Toolbar";
import { projects } from "@/data/projects";
import { tags } from "@/data/tags";

const TAG_OPTIONS = [...new Set(projects.flatMap((p) => p.tags))]
    .filter((id) => !tags[id]?.special)
    .map((id) => ({ value: id, label: tags[id]?.name ?? id }));

export default function ProjectToolbar({ tags: selected, setTags }) {
    return (
        <Toolbar
            dropdowns={[
                { id: "tag", label: "all tags", options: TAG_OPTIONS, value: selected, onChange: setTags },
            ]}
        />
    );
}
