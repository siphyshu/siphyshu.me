"use client";

import { useState } from "react";

import HandprintWall from "@/components/handprint-wall/HandprintWall";
import HeaderSection2 from "@/components/hero/HeaderSection2";
import NavBar from "@/components/ui/NavBar";
import ProjectGallery from "@/components/projects/ProjectGallery";
import ProjectToolbar from "@/components/projects/ProjectToolbar";
import ArticleList from "@/components/articles/ArticleList";
import ArticleToolbar from "@/components/articles/ArticleToolbar";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import CtfList from "@/components/ctfs/CtfList";
import CtfToolbar from "@/components/ctfs/CtfToolbar";
import SearchBar from "@/components/search/SearchBar";
import SearchResults from "@/components/search/SearchResults";
import { useSearch } from "@/components/search/SearchContext";

const FRAME_STYLE = "wood-frame-lighter-brown";

export default function Home() {
  const [activeTab, setActiveTab] = useState("projects");
  const [projectTags, setProjectTags] = useState([]);
  const [articleTags, setArticleTags] = useState([]);
  const [articleOrder, setArticleOrder] = useState(null);
  const [ctfCategories, setCtfCategories] = useState([]);
  const [ctfStatuses, setCtfStatuses] = useState([]);
  const { isSearching } = useSearch();

  const toolbarByTab = {
    projects: <ProjectToolbar tags={projectTags} setTags={setProjectTags} />,
    articles: (
      <ArticleToolbar
        tags={articleTags}
        setTags={setArticleTags}
        order={articleOrder}
        setOrder={setArticleOrder}
      />
    ),
    ctfs: (
      <CtfToolbar
        categories={ctfCategories}
        setCategories={setCtfCategories}
        statuses={ctfStatuses}
        setStatuses={setCtfStatuses}
      />
    ),
  };

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
        <div className={`mx-auto mt-8 mb-12`}>
          <HandprintWall className={FRAME_STYLE}/>
        </div>
      )}

      {/* Showcase Section - Hide when searching */}
      {!isSearching && (
        <div className="max-w-4xl w-full mx-auto mb-16">
          <NavBar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            actions={toolbarByTab[activeTab] ?? null}
          />

          <ProjectGallery
            className={activeTab === "projects" ? "block" : "hidden"}
            tags={projectTags}
          />
          <ArticleList
            className={activeTab === "articles" ? "block" : "hidden"}
            tags={articleTags}
            order={articleOrder}
          />
          <GalleryGrid className={activeTab === "gallery" ? "block" : "hidden"} />
          <CtfList
            className={activeTab === "ctfs" ? "block" : "hidden"}
            categories={ctfCategories}
            statuses={ctfStatuses}
          />
        </div>
      )}
    </>
  );
}
