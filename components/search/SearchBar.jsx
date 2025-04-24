"use client"

import { useState } from 'react';
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

    return (
        <div className="w-full max-w-md mb-8 mx-auto">
            <div className={`flex items-center border ${isFocused ? 'border-black' : 'border-gray-300'} px-3 py-2 transition-colors duration-200`}>
                <Search size={16} className="text-gray-500 mr-2" />
                <input
                    type="text"
                    placeholder="Search projects, articles, tags..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full text-sm focus:outline-none"
                />
                {searchQuery && (
                    <button 
                        onClick={handleClearSearch}
                        className="text-gray-500 hover:text-black transition-colors duration-200"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;