"use client"

import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import { formatContentDate } from "@/lib/format";

export default function ArticleItem({
    date,
    title,
    subtitle,
    thumbnail = "/thumbnails/articles/placeholder-thumbnail.png",
    href,
    // Pieces published on Medium link straight out; ones hosted here route
    // through next/link so the transition is client-side.
    isExternal = false,
}) {
    const body = (
        <>
            {/* Article Thumbnail */}
            <div className="flex items-start justify-center relative aspect-square w-[20%] min-w-[80px] max-w-[80px]">
                <Image
                    src={thumbnail}
                    alt="Project Image"
                    width={500}
                    height={500}
                    className="object-cover rounded-xl border w-full border-black"
                />
            </div>

            {/* Article Content */}
            <div className="flex flex-col justify-between px-4 pb-3 pt-0 flex-1">
                <div>
                    {/* Date */}
                    {date && (
                        <div className="text-gray-500 text-xs uppercase leading-none">
                            {formatContentDate(date)}
                        </div>
                    )}
                    <h2 className="text-black prose prose-md md:prose-lg leading-tight md:leading-loose max-w-none mt-2 md:mt-1">{title}</h2>
                    <div className="mt-2 md:mt-0">
                        <div className="text-gray prose prose-sm leading-snug text-justify">
                            <ReactMarkdown>{subtitle}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    const className = "flex flex-row bg-white min-w-[250px] cursor-pointer";

    if (isExternal) {
        return <a href={href} className={className}>{body}</a>;
    }

    return <Link href={href} className={className}>{body}</Link>;
}
