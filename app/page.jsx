"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import HandprintCanvasDev from "@/components/handprint-wall/HandprintCanvasDev";
import HeaderSection from "@/components/hero/HeaderSection";
import HeaderSection2 from "@/components/hero/HeaderSection2";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import WorkInProgressPopup from "@/components/ui/WorkInProgressPopup";
import ProjectGallery from "@/components/projects/ProjectGallery";
import ArticleList from "@/components/articles/ArticleList";
import SearchBar from "@/components/search/SearchBar";

export default function Home() {
  const [activeTab, setActiveTab] = useState("projects");
  const [frameStyle, setFrameStyle] = useState("wood-frame-lighter-brown");

  const cycleFrame = () => {
    const frames = [
      "wood-frame-lighter-brown",
      // "wood-frame-lighter-brown-2",
    ];
    const currentIndex = frames.indexOf(frameStyle);
    const nextIndex = (currentIndex + 1) % frames.length;
    setFrameStyle(frames[nextIndex]);
  };

  return (
    <>
      <main className="flex font-serif flex-col min-h-screen w-screen bg-white text-black items-center px-4">
        <WorkInProgressPopup />
        <div className="max-w-4xl w-full mx-auto">
        
          {/* Introduction */}
          {/* <HeaderSection /> */}
          <HeaderSection2 />
          
          {/* <SearchBar /> */}
          
          {/* Interactive Artwork */}
          <div className={`mx-auto mb-2 mt-8`}>
          {/* <div className={`mx-auto mb-8`}> */}
            <HandprintCanvasDev className={`${frameStyle}`}/>
          </div>

          {/* Showcase Section */}
          <div className="max-w-4xl w-full mx-auto mb-16" onClick={cycleFrame}>
            <NavBar 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            
            <ProjectGallery className={activeTab === "projects" ? "block" : "hidden"} />
            <ArticleList className={activeTab === "articles" ? "block" : "hidden"} />

          </div>

          <Footer />
        </div>
      </main>
    </>
  );
}