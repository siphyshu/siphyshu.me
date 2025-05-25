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
        <a 
            href={link} 
            className="flex flex-row bg-white min-w-[250px] cursor-pointer"
        >
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
                            {formatDate(date)}
                        </div>
                    )}
                    <h2 className="text-black prose prose-md md:prose-lg leading-tight md:leading-loose max-w-none mt-2 md:mt-1">{title}</h2>
                    <div className="mt-2 md:mt-0">
                        <div className="text-gray prose prose-sm leading-snug">
                            <ReactMarkdown>{subtitle}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>
        </a>
    )
}