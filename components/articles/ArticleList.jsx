"use client"

import ArticleItem from "@/components/articles/ArticleItem";
import { articles } from "@/data/articles";

function parseDate(dateString) {
    const [day, month, year] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day).getTime();
}

const sorted = [...articles].sort((a, b) => parseDate(b.date) - parseDate(a.date));

const ArticleList = ({ className, tags = [], order }) => {
    const filtered = tags.length > 0
        ? sorted.filter((a) => a.topics.some((t) => tags.includes(t)))
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
                    <div key={article.id}>
                        <ArticleItem
                            date={article.date}
                            title={article.title}
                            subtitle={article.subtitle}
                            thumbnail={article.thumbnail}
                            topics={article.topics}
                            readMinutes={article.readMinutes}
                            link={article.link}
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
