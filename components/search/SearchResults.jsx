"use client"

import { useSearch } from './SearchContext';
import ProjectCard from '@/components/projects/ProjectCard';
import ArticleItem from '@/components/articles/ArticleItem';
import { resolveTags } from '@/lib/tags';

// Content can't be read from a client component, so both collections are
// handed down from app/(site)/layout.jsx. They're small — everything on the
// site, minus article bodies — and this is a substring filter, not an index.
// When the Cmd+K palette lands it replaces this wholesale; until then the
// matching rules live in one place here rather than two.

/** Tag display names and keywords are both searchable; only tags are rendered. */
function matchesTerms(item, query) {
    const inTags = resolveTags(item.tags).some((tag) =>
        tag.name.toLowerCase().includes(query)
    );
    const inKeywords = item.keywords.some((keyword) =>
        keyword.toLowerCase().includes(query)
    );
    return inTags || inKeywords;
}

const SearchResults = ({ projects = [], articles = [] }) => {
    const { searchQuery, isSearching } = useSearch();

    if (!isSearching) return null;

    const query = searchQuery.toLowerCase();

    const filteredProjects = projects.filter((project) =>
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        matchesTerms(project, query)
    );

    const filteredArticles = articles.filter((article) =>
        article.title.toLowerCase().includes(query) ||
        article.subtitle.toLowerCase().includes(query) ||
        matchesTerms(article, query)
    );

    const hasResults = filteredProjects.length > 0 || filteredArticles.length > 0;
    const resultCount = filteredProjects.length + filteredArticles.length;

    if (!hasResults) {
        return (
            <div className="text-center py-12 my-8 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-500">No results found for "<span className="font-medium text-black">{searchQuery}</span>"</p>
                <p className="text-gray-400 text-sm mt-1">Try different keywords or check for typos</p>
            </div>
        );
    }

    return (
        <div className="mb-16 mt-4">
            <div className="mb-8 pb-4 border-b border-gray-200">
                <div className="flex justify-between items-baseline">
                    <h2 className="text-lg font-medium">Results for "<span className="italic">{searchQuery}</span>"</h2>
                    <span className="text-sm text-gray-500">{resultCount} {resultCount === 1 ? 'item' : 'items'} found</span>
                </div>
            </div>

            {filteredProjects.length > 0 && (
                <div className="mb-12">
                    <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-4 font-medium">Projects</h3>
                    <div className="grid lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2">
                        {filteredProjects.map((project) => (
                            <ProjectCard
                                key={project.slug}
                                title={project.title}
                                description={project.description}
                                links={project.links}
                                thumbnail={project.thumbnail}
                                tags={resolveTags(project.tags)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {filteredArticles.length > 0 && (
                <div>
                    <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-4 font-medium">Articles</h3>
                    <div className="flex flex-col space-y-6">
                        {filteredArticles.map((article, index) => (
                            <div key={article.slug} className={index === 0 ? "" : "pt-2"}>
                                <ArticleItem
                                    date={article.date}
                                    title={article.title}
                                    subtitle={article.subtitle}
                                    thumbnail={article.thumbnail}
                                    href={article.external ?? `/articles/${article.slug}`}
                                    isExternal={Boolean(article.external)}
                                />
                                {index < filteredArticles.length - 1 && (
                                    <hr className="mt-6 border-gray-200" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchResults;
