"use client";

import { useState } from "react";

import HandprintWall from "@/components/handprint-wall/HandprintWall";
import HeaderSection2 from "@/components/hero/HeaderSection2";
import NavBar from "@/components/ui/NavBar";
import ProjectGallery from "@/components/projects/ProjectGallery";
import ArticleList from "@/components/articles/ArticleList";
import SearchBar from "@/components/search/SearchBar";
import SearchResults from "@/components/search/SearchResults";
import { useSearch } from "@/components/search/SearchContext";

const FRAME_STYLE = "wood-frame-lighter-brown";

export default function Home() {
  const [activeTab, setActiveTab] = useState("projects");
  const { isSearching } = useSearch();

  return (
    <>
      {/* Introduction */}
      <HeaderSection2 />
      
      {/* Search Section */}
      <div className="mt-4 mb-12">
        <SearchBar />
      </div>
      
      {/* Search Results */}
      <div className={isSearching ? "block" : "hidden"}>
        <SearchResults />
      </div>
      
      {/* Interactive Artwork - Hide when searching */}
      {!isSearching && (
        <div className={`mx-auto my-8`}>
          <HandprintWall className={FRAME_STYLE}/>
        </div>
      )}

      {/* Showcase Section - Hide when searching */}
      {!isSearching && (
        <div className="max-w-4xl w-full mx-auto mb-16">
          <NavBar 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          
          <ProjectGallery className={activeTab === "projects" ? "block" : "hidden"} />
          <ArticleList className={activeTab === "articles" ? "block" : "hidden"} />
        </div>
      )}
    </>
  );
}