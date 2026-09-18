"use client"

import Image from "next/image";
import ReactMarkdown from 'react-markdown';

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function formatDate(dateString) {
    const [day, month, year] = dateString.split("-");
    return `${parseInt(day)} ${MONTHS[parseInt(month) - 1]} ${year}`;
}

export default function ArticleItem({
    date,
    title,
    subtitle,
    thumbnail = "/thumbnails/articles/placeholder-thumbnail.png",
    topics = [],
    readMinutes,
    link,
    isFirst = false,
}) {
    return (
        <a
            href={link}
            className={`flex items-center gap-6 group ${isFirst ? "pb-5" : "py-5"}`}
        >
            <div className="relative w-28 h-16 shrink-0 border border-black overflow-hidden">
                <Image src={thumbnail} alt={title} fill className="object-cover" />
            </div>

            <div className="flex-1 min-w-0">
                <h2 className="prose prose-lg text-black max-w-none group-hover:underline">
                    {title}
                </h2>
                {subtitle && (
                    <div className="text-gray-500 text-sm leading-snug mt-1 prose prose-sm max-w-none line-clamp-2">
                        <ReactMarkdown>{subtitle}</ReactMarkdown>
                    </div>
                )}
            </div>

            <div className="hidden md:flex flex-col items-end gap-2 shrink-0 pl-6">
                {topics.length > 0 && (
                    <div className="flex gap-1.5 flex-nowrap justify-end">
                        {topics.slice(0, 3).map((topic) => (
                            <span
                                key={topic}
                                className="px-2 py-0.5 text-[10px] border rounded-full text-gray-500 border-gray-300"
                            >
                                {topic}
                            </span>
                        ))}
                    </div>
                )}
                <div className="text-gray-400 text-xs">
                    {formatDate(date)}{readMinutes ? ` · ${readMinutes} min read` : ""}
                </div>
            </div>
        </a>
    )
}
