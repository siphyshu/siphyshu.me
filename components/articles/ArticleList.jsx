"use client"

import ArticleItem from "@/components/articles/ArticleItem";
import { articles } from "@/data/articles";

const ArticleList = ({ className }) => {
    return (
        <div className={`flex flex-col justify-start ${className}`}>
            <div>
                {articles.map((article, index) => (
                    <div key={article.id}>
                        <ArticleItem
                            date={article.date}
                            title={article.title}
                            subtitle={article.subtitle}
                            thumbnail={article.thumbnail}
                            link={article.link}
                            topics={article.topics}
                        />
                        {index < articles.length - 1 && (
                            <hr className="my-4 border-gray-300" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ArticleList;