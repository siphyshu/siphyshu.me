"use client";

import Toolbar from "@/components/ui/Toolbar";
import { articles } from "@/data/articles";

const ALL_TOPICS = [...new Set(articles.flatMap((a) => a.topics))];

export default function ArticleToolbar({ tags, setTags, order, setOrder }) {
    return (
        <Toolbar
            dropdowns={[
                { id: "tag", label: "all tags", options: ALL_TOPICS, value: tags, onChange: setTags },
                {
                    id: "order",
                    type: "toggle",
                    label: "latest",
                    options: ["latest", "oldest"],
                    value: order,
                    onChange: (v) => setOrder(v === "latest" ? null : v),
                },
            ]}
        />
    );
}
