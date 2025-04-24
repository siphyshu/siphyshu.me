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
    
    if (!hasResults) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No results found for "{searchQuery}"</p>
            </div>
        );
    }
    
    return (
        <div className="mb-16">
            <h2 className="text-xl font-medium mb-4">Search Results for "{searchQuery}"</h2>
            
            {filteredProjects.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-medium mb-2">Projects</h3>
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
                    <h3 className="text-lg font-medium mb-2">Articles</h3>
                    <div className="flex flex-col">
                        {filteredArticles.map((article, index) => (
                            <div key={article.id}>
                                <ArticleItem
                                    date={article.date}
                                    title={article.title}
                                    subtitle={article.subtitle}
                                    thumbnail={article.thumbnail}
                                    link={article.link}
                                    topics={article.topics}
                                />
                                {index < filteredArticles.length - 1 && (
                                    <hr className="my-4 border-gray-300" />
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