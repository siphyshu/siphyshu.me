"use client"

import Image from "next/image";
import ReactMarkdown from 'react-markdown';

export default function ArticleItem({
    date,
    title, 
    subtitle, 
    thumbnail = "/thumbnails/articles/placeholder-thumbnail.png", 
    link,
    topics = []
}) {
    // Function to format the date
    const formatDate = (dateString) => {
        const months = [
            "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
            "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
        ];
        const [day, month, year] = dateString.split("-");
        return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
    };

    return (
        <div className="flex flex-row bg-white min-w-[250px]">
            {/* Article Thumbnail */}
            <div className="flex items-start justify-center relative aspect-square">
                <Image
                    src={thumbnail}
                    alt="Project Image"
                    width={500}
                    height={500}
                    className="object-cover rounded-xl border w-[90px] md:w-[120px] border-black"
                />
            </div>

            {/* Article Content */}
            <div className="flex flex-col justify-between px-4 pb-1">
                <div>
                    <h2 className="text-black prose prose-md md:prose-lg leading-tight md:leading-loose">{title}</h2>
                    <div className="hidden md:block"> { /* DO NOT REMOVE THIS DIV because line-clamp breaks for some reason */ }
                        <div className="text-gray prose prose-sm line-clamp-3 leading-snug overflow-hidden">
                            <ReactMarkdown>{subtitle}</ReactMarkdown>
                        </div>
                    </div>
                </div>
                
                {/* Date */}
                {date && (
                    <div className="text-gray-500 text-xs uppercase mt-auto">
                        {formatDate(date)}
                    </div>
                )}
            </div>
        </div>
    )
}