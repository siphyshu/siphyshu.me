"use client"

import ArticleItem from "@/components/articles/ArticleItem";
import { allArticles } from "content-collections";

// Newest first. Dates are YYYY-MM-DD, so a string compare is chronological.
const sorted = [...allArticles].sort((a, b) => b.date.localeCompare(a.date));

// The toolbar's plural ("essays") to the frontmatter's kind ("essay").
const KINDS = { articles: "article", essays: "essay" };

const ArticleList = ({ className = "", tags = [], kind, order }) => {
    const filtered = sorted
        .filter((a) => !kind || a.kind === KINDS[kind])
        .filter((a) => tags.length === 0 || a.tags.some((t) => tags.includes(t)));
    const displayed = order === "oldest" ? [...filtered].reverse() : filtered;

    return (
        <div className={`flex flex-col justify-start ${className}`}>
            {displayed.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-10">
                    nothing matches the selected filters
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
                            kind={article.kind}
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
