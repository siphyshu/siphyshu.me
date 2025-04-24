"use client"

import { useSearch } from './SearchContext';
import { projects } from '@/data/projects';
import { articles } from '@/data/articles';
import { tags } from '@/data/tags';
import ProjectCard from '@/components/projects/ProjectCard';
import ArticleItem from '@/components/articles/ArticleItem';

const SearchResults = () => {
    const { searchQuery, isSearching } = useSearch();
    
    if (!isSearching) return null;
    
    // Search logic for projects
    const filteredProjects = projects.filter(project => {
        const query = searchQuery.toLowerCase();
        const titleMatch = project.title.toLowerCase().includes(query);
        const descriptionMatch = project.description.toLowerCase().includes(query);
        
        // Search in project tags
        const tagMatch = project.tags.some(tagId => {
            const tag = tags[tagId];
            return tag && tag.name.toLowerCase().includes(query);
        });
        
        // Search in hidden tags if they exist
        const hiddenTagMatch = project.hiddentags 
            ? project.hiddentags.some(tag => tag.toLowerCase().includes(query))
            : false;
        
        return titleMatch || descriptionMatch || tagMatch || hiddenTagMatch;
    });
    
    // Search logic for articles
    const filteredArticles = articles.filter(article => {
        const query = searchQuery.toLowerCase();
        const titleMatch = article.title.toLowerCase().includes(query);
        const subtitleMatch = article.subtitle.toLowerCase().includes(query);
        
        // Search in article topics if they exist
        const topicMatch = article.topics 
            ? article.topics.some(topic => topic.toLowerCase().includes(query))
            : false;
        
        return titleMatch || subtitleMatch || topicMatch;
    });
    
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
                                key={project.id}
                                title={project.title}
                                description={project.description}
                                links={project.links}
                                thumbnail={project.thumbnail}
                                tags={project.tags
                                    .map((tagId) => tags[tagId])
                                    .filter(Boolean)}
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
                            <div key={article.id} className={index === 0 ? "" : "pt-2"}>
                                <ArticleItem
                                    date={article.date}
                                    title={article.title}
                                    subtitle={article.subtitle}
                                    thumbnail={article.thumbnail}
                                    link={article.link}
                                    topics={article.topics}
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