import ArticleItem from "@/components/articles/ArticleItem";

// A server component now — see the note in ProjectGallery. Articles arrive
// already sorted newest-first and already filtered for drafts by lib/content.
const ArticleList = ({ articles = [], className = "" }) => {
    return (
        <div className={`flex flex-col justify-start ${className}`}>
            <div>
                {articles.map((article, index) => (
                    <div key={article.slug}>
                        <ArticleItem
                            date={article.date}
                            title={article.title}
                            subtitle={article.subtitle}
                            thumbnail={article.thumbnail}
                            href={article.external ?? `/articles/${article.slug}`}
                            isExternal={Boolean(article.external)}
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
