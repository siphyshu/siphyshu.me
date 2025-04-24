"use client"

import { useState, useEffect } from 'react';
import { useSearch } from './SearchContext';
import { Search, X } from 'lucide-react';

const SearchBar = () => {
    const { searchQuery, updateSearchQuery, clearSearch } = useSearch();
    const [isFocused, setIsFocused] = useState(false);

    const handleSearchChange = (e) => {
        updateSearchQuery(e.target.value);
    };

    const handleClearSearch = () => {
        clearSearch();
    };

    // Add keyboard shortcut handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            // ESC key to clear search
            if (e.key === 'Escape' && searchQuery) {
                clearSearch();
            }
            
            // CTRL+K or CMD+K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('search-input')?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [searchQuery, clearSearch]);

    return (
        <div className="w-full max-w-md mx-auto">
            <div 
                className={`flex items-center border rounded-md shadow-sm 
                ${isFocused 
                    ? 'border-black shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'}
                px-4 py-2.5 transition-all duration-200 bg-white`}
            >
                <Search size={18} className={`${isFocused ? 'text-black' : 'text-gray-400'} mr-3 transition-colors duration-200`} />
                <input
                    id="search-input"
                    type="text"
                    placeholder="Search projects, articles, tags..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full text-sm focus:outline-none placeholder-gray-400"
                    aria-label="Search"
                />
                {searchQuery ? (
                    <button 
                        onClick={handleClearSearch}
                        className="text-gray-400 hover:text-black transition-colors duration-200 p-1 rounded-full hover:bg-gray-100 block sm:hidden"
                        aria-label="Clear search"
                        title="Clear search (ESC)"
                    >
                        <X size={16} />
                    </button>
                ) : (
                    <div className="text-xs text-gray-400 items-center select-none hidden md:flex">
                        <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Ctrl</kbd>
                        <span className="mx-1">+</span>
                        <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">K</kbd>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchBar;