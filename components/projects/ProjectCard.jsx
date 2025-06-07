"use client";

import Image from "next/image";
import { FaGithub } from "react-icons/fa";
import ReactMarkdown from 'react-markdown';

export default function ProjectCard({ 
        title, 
        description, 
        thumbnail = "/thumbnails/projects/placeholder-thumbnail.png", 
        links = {}, 
        tags = [] 
    }) {
    
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

        const iconMap = {
            github: <FaGithub className="text-gray-800 text-2xl cursor-pointer" />,
            external: (
                <Image
                    src="/icons/external_link.svg"
                    alt="External Link"
                    width={18}
                    height={18}
                    className="cursor-pointer"
                />
            ),
        };

        return (
            <div className="flex flex-col bg-white border border-black shadow-md min-w-[250px]">
                {/* Project Thumbnail */}
                <div className="flex items-center justify-center w-full relative aspect-[1.91/1]">
                    <Image
                        src={thumbnail}
                        alt="Project Image"
                        fill
                        className="w-full h-full object-fill"
                    />
                </div>

                {/* Project Content */}
                <div className="font-serif p-4">
                    <div className="flex justify-between items-center">
                        {/* Title */}
                        <h2 className="text-black prose prose-lg">{title}</h2>
                        {/* Links */}
                        <div className="flex items-center gap-2">
                            {Object.entries(links).map(([key, url]) => (
                                <a key={key} href={url} target="_blank" rel="noopener noreferrer">
                                    {iconMap[key] || (
                                        <span className="text-gray-800 text-sm cursor-pointer">
                                            {key}
                                        </span>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-2 mt-2">
                        {tags
                            .filter(Boolean)
                            .map((tag, index) => (
                                <span
                                    key={index}
                                    className={`px-2 py-1 text-[10px] border rounded-full ${tagColorVariants[tag.color]} ${tag.special ? 'relative pl-4 bg-emerald-100' : ''}`}
                                >
                                    {tag.special && (
                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    )}
                                    {tag.name}
                                </span>
                            ))}
                    </div>

                    {/* Description */}
                    <div className="text-gray mt-4 line-clamp-3 overflow-hidden prose prose-sm text-justify">
                        <ReactMarkdown>{description}</ReactMarkdown>
                    </div>
                </div>
            </div>
        );
}
