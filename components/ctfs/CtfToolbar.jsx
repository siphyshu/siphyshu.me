"use client";

import Toolbar from "@/components/ui/Toolbar";
import { ctfs } from "@/data/ctfs";

const CATEGORIES = [...new Set(ctfs.map((c) => c.category))];
const STATUSES = [...new Set(ctfs.map((c) => c.status))];

export default function CtfToolbar({ categories, setCategories, statuses, setStatuses }) {
    return (
        <Toolbar
            dropdowns={[
                { id: "category", label: "all categories", options: CATEGORIES, value: categories, onChange: setCategories },
                { id: "status", label: "all statuses", options: STATUSES, value: statuses, onChange: setStatuses },
            ]}
        />
    );
}
