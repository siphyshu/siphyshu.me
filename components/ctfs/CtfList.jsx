"use client";

import CtfCard from "@/components/ctfs/CtfCard";
import { ctfs } from "@/data/ctfs";

const CtfList = ({ className, categories = [], statuses = [] }) => {
    const filtered = ctfs.filter(
        (c) =>
            (categories.length === 0 || categories.includes(c.category)) &&
            (statuses.length === 0 || statuses.includes(c.status))
    );

    return (
        <div className={className}>
            {filtered.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-10">
                    no challenges match those filters
                </p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
                {filtered.map((ctf) => (
                    <CtfCard key={ctf.id} ctf={ctf} />
                ))}
            </div>
        </div>
    );
};

export default CtfList;
