"use client";

import React from "react";

// ---------------------------------------------------------------------
// Tag Color Variants (base palette)
// ---------------------------------------------------------------------
const tagColorVariants = {
  red: "text-red-500 border-red-600 transition-colors duration-200 hover:bg-red-50 hover:border-red-500 cursor-pointer",
  coral: "text-[hsl(12,80%,50%)] border-[hsl(12,80%,45%)] transition-colors duration-200 hover:bg-[hsl(12,80%,95%)] hover:border-[hsl(12,80%,50%)] cursor-pointer",
  orange: "text-orange-500 border-orange-600 transition-colors duration-200 hover:bg-orange-50 hover:border-orange-500 cursor-pointer",
  yellow: "text-yellow-500 border-yellow-600 transition-colors duration-200 hover:bg-yellow-50 hover:border-yellow-500 cursor-pointer",
  lime: "text-lime-500 border-lime-600 transition-colors duration-200 hover:bg-lime-50 hover:border-lime-500 cursor-pointer",
  green: "text-green-500 border-green-600 transition-colors duration-200 hover:bg-green-50 hover:border-green-500 cursor-pointer",
  mint: "text-[hsl(150,60%,40%)] border-[hsl(150,60%,35%)] transition-colors duration-200 hover:bg-[hsl(150,60%,95%)] hover:border-[hsl(150,60%,45%)] cursor-pointer",
  emerald: "text-emerald-500 border-emerald-600 transition-colors duration-200 hover:bg-emerald-50 hover:border-emerald-500 cursor-pointer",
  teal: "text-teal-500 border-teal-600 transition-colors duration-200 hover:bg-teal-50 hover:border-teal-500 cursor-pointer",
  cyan: "text-cyan-500 border-cyan-600 transition-colors duration-200 hover:bg-cyan-50 hover:border-cyan-500 cursor-pointer",
  blue: "text-blue-500 border-blue-600 transition-colors duration-200 hover:bg-blue-50 hover:border-blue-500 cursor-pointer",
  indigo: "text-indigo-500 border-indigo-600 transition-colors duration-200 hover:bg-indigo-50 hover:border-indigo-500 cursor-pointer",
  lavender: "text-[hsl(240,50%,60%)] border-[hsl(240,50%,55%)] transition-colors duration-200 hover:bg-[hsl(240,50%,95%)] hover:border-[hsl(240,50%,60%)] cursor-pointer",
  fuchsia: "text-fuchsia-500 border-fuchsia-600 transition-colors duration-200 hover:bg-fuchsia-50 hover:border-fuchsia-500 cursor-pointer",
  pink: "text-pink-500 border-pink-600 transition-colors duration-200 hover:bg-pink-50 hover:border-pink-500 cursor-pointer",
  rose: "text-rose-500 border-rose-600 transition-colors duration-200 hover:bg-rose-50 hover:border-rose-500 cursor-pointer",
  slate: "text-slate-500 border-slate-600 transition-colors duration-200 hover:bg-slate-50 hover:border-slate-500 cursor-pointer",
  zinc: "text-zinc-500 border-zinc-600 transition-colors duration-200 hover:bg-zinc-50 hover:border-zinc-500 cursor-pointer",
};

// ---------------------------------------------------------------------
// Domain & Technology Tags with vibe-appropriate colors assigned
// ---------------------------------------------------------------------
export const tags = {
  // Domain Specific
  "web": { name: "web", color: "blue" },
  "mobile": { name: "mobile", color: "cyan" },
  "ai/ml": { name: "ai/ml", color: "indigo" },
  "cybersecurity": { name: "cybersecurity", color: "red" },
  "data-science": { name: "data-science", color: "emerald" },
  "blockchain": { name: "blockchain", color: "coral" },
  "game-dev": { name: "game-dev", color: "rose" },
  "ui/ux": { name: "ui/ux", color: "lavender" },
  "robotics": { name: "robotics", color: "mint" },
  "automation": { name: "automation", color: "orange" },
  "electronics": { name: "electronics", color: "green" },
  "hardware": { name: "hardware", color: "zinc" },

  // Tools
  "docker": { name: "docker", color: "blue" },
  "kubernetes": { name: "kubernetes", color: "teal" },
  "aws": { name: "aws", color: "orange" },
  "azure": { name: "azure", color: "indigo" },
  "gcp": { name: "gcp", color: "cyan" },
  "firebase": { name: "firebase", color: "yellow" },
  "supabase": { name: "supabase", color: "fuchsia" },
  "blender": { name: "blender", color: "coral" },
  "figma": { name: "figma", color: "pink" },

  // Frameworks
  "react": { name: "react", color: "blue" },
  "react-native": { name: "react-native", color: "indigo" },
  "nextjs": { name: "nextjs", color: "slate" },
  "astro": { name: "astro", color: "mint" },
  "fastapi": { name: "fastapi", color: "green" },
  "tailwindcss": { name: "tailwindcss", color: "teal" },
  "flutter": { name: "flutter", color: "indigo" },
  "electron": { name: "electron", color: "cyan" },
  
  // Languages
  "python": { name: "python", color: "blue" },
  "javascript": { name: "javascript", color: "yellow" },
  "c++": { name: "c++", color: "slate" },
  "rust": { name: "rust", color: "rose" },
  "java": { name: "java", color: "red" },
  "go": { name: "go", color: "cyan" },
  "elixir": { name: "elixir", color: "lavender" },
};

// ---------------------------------------------------------------------
// Convert the tags object into an array for rendering
// ---------------------------------------------------------------------
const tagList = Object.values(tags);

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
          {Object.keys(tagColorVariants).map((color, index) => (
            <span
              key={index}
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
