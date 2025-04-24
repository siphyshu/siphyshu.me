"use client"

import { createContext, useState, useContext } from 'react';

// Create context
const SearchContext = createContext();

// Create provider component
export function SearchProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Function to update search query
  const updateSearchQuery = (query) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
  };

  // Function to clear search
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  // Values to be provided to consuming components
  const values = {
    searchQuery,
    isSearching,
    updateSearchQuery,
    clearSearch,
  };

  return (
    <SearchContext.Provider value={values}>
      {children}
    </SearchContext.Provider>
  );
}

// Custom hook to use the search context
export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
} 