"use client"

import ArticleItem from "@/components/articles/ArticleItem";
import { allArticles } from "content-collections";

// Newest first. Dates are YYYY-MM-DD, so a string compare is chronological.
const sorted = [...allArticles].sort((a, b) => b.date.localeCompare(a.date));

const ArticleList = ({ className = "", tags = [], order }) => {
    const filtered = tags.length > 0
        ? sorted.filter((a) => a.tags.some((t) => tags.includes(t)))
        : sorted;
    const displayed = order === "oldest" ? [...filtered].reverse() : filtered;

    return (
        <div className={`flex flex-col justify-start ${className}`}>
            {displayed.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-10">
                    no articles match the selected tags
                </p>
            )}
            <div>
                {displayed.map((article, index) => (
                    <div key={article.slug}>
                        <ArticleItem
                            date={article.date}
                            title={article.title}
                            subtitle={article.subtitle}
                            thumbnail={article.thumbnail}
                            tags={article.tags}
                            readMinutes={article.readMinutes}
                            href={article.href}
                            hosted={article.hosted}
                            isFirst={index === 0}
                        />
                        {index < displayed.length - 1 && (
                            <hr className="border-gray-200" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ArticleList;
