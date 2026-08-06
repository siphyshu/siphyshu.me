"use client";

import { tagColorVariants, tags } from "@/data/tags";

// ---------------------------------------------------------------------
// Convert the tags object into an array for rendering
// ---------------------------------------------------------------------
const tagList = Object.values(tags);
const colorList = Object.keys(tagColorVariants) as (keyof typeof tagColorVariants)[];

// ---------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------
export default function TagShowcasePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 space-y-12">
      {/* Section 1: Base Color Palette */}
      <section>
        <h1 className="text-3xl font-bold mb-6">Base Color Palette</h1>
        <div className="flex mt-2 gap-2 flex-wrap max-w-[500px]">
          {colorList.map((color) => (
            <span
              key={color}
              className={`px-2 py-1 border rounded-full text-[10px] ${tagColorVariants[color]}`}
            >
              {color}
            </span>
          ))}
        </div>
      </section>

      {/* Section 2: Tag Showcase */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Tag Showcase</h2>
        <div className="flex mt-2 gap-2 flex-wrap max-w-[500px]">
          {tagList.map((tag, index) => (
            <span
              key={index}
              className={`px-2 py-1 border rounded-full text-[10px] ${tagColorVariants[tag.color]}`}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
