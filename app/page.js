"use client"

import Image from "next/image"
import { useEffect } from "react"
import HandprintCanvas from "../components/HandprintCanvas"

export default function Home() {
  useEffect(() => {
    const lastPopupTime = localStorage.getItem("lastPopupTime");
    if (!lastPopupTime || (Date.now() - parseInt(lastPopupTime, 10)) > (24 * 60 * 60 * 1000)) {
      setTimeout(() => {
        const popup = document.getElementById("popup");
        popup?.classList.add("active");
        localStorage.setItem("lastPopupTime", Date.now().toString());
      }, 3000);
    }

    const popup = document.getElementById("popup");
    popup?.addEventListener("click", () => {
      popup.classList.remove("active");
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9f6] font-serif text-black">
      <div id="popup" className="fixed top-[-100%] left-1/2 transform -translate-x-1/2 bg-red-50 bg-opacity-2 rounded-full py-2 px-4 border border-black cursor-pointer transition-all duration-500 ease-in-out">
        <p>this site is a work-in-progress ⚠️</p>
      </div>
      <main className="flex flex-col items-center justify-center pt-52 px-4">
        <div className="text-center">
          <p className="text-2xl mb-4">hey, i"m jaiyank!</p>
          <Image src="/images/siphyshu.png" alt="siphyshu" width={120} height={120} className="mx-auto mb-4" />
          <p className="text-base mb-4">
            20 y/o <Image src="/images/india_flag_small.png" alt="India flag" width={16} height={16} className="inline" /> ・exploring CS @ VITB
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          <a href="https://github.com/siphyshu" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 underline hover:text-blue-800">
            <Image src="/images/github-mark.svg" alt="GitHub" width={20} height={20} className="mr-1" />
            GitHub
          </a>
          <a href="https://x.com/siphyshu" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 underline hover:text-blue-800 whitespace-nowrap">
            <Image src="/images/twitter_small.png" alt="Twitter" width={20} height={20} className="mr-1" />
            Twitter (X)
          </a>
          <a href="https://siphyshu.medium.com" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 underline hover:text-blue-800">
            <Image src="/images/medium_small.png" alt="Medium" width={20} height={20} className="mr-1" />
            Blog
          </a>
          <a href="https://linkedin.com/in/jaiyank-saxena" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 underline hover:text-blue-800">
            <Image src="/images/linkedin_small.png" alt="LinkedIn" width={20} height={20} className="mr-1" />
            LinkedIn
          </a>
        </div>
        <HandprintCanvas />
      </main>
    </div>
  )
}