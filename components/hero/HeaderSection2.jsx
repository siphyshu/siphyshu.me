'use client'

import Image from 'next/image'
import { useState } from 'react'

import LinkPanel from "@/components/hero/LinkPanel";
import TextMorph from "@/components/hero/TextMorph";
import { getAge } from "@/lib/age";

const HeaderSection = () => {
    // Add state for tracking hover
    const [isHoveringSiphyshu, setIsHoveringSiphyshu] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)

    const handleMouseEnter = () => {
        setIsHoveringSiphyshu(true)
        setIsAnimating(true)
    }

    const handleMouseLeave = () => {
        setIsHoveringSiphyshu(false)
        setIsAnimating(true)
    }

    return (
        <header className="text-center mt-16 md:mt-32">
            
            {/* Bio Section */}
            <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-4 md:gap-6 mb-3">
                {/* Spacer - only show on desktop */}
                <div className="hidden md:block w-[10px]"></div>

                {/* Profile Pics */}
                <div className="relative rounded-full" data-gol-mask>
                    <Image
                        src="/images/jaiyank.jpg"
                        alt="jaiyank"
                        width={112}
                        height={112}
                        priority={true}
                        className="mx-auto rounded-full"
                    />
                    <div className="relative group">
                        <Image 
                            src="/images/siphyshu.jpg"
                            alt="siphyshu"
                            width={50}
                            height={50}
                            priority={true}
                            className="mx-auto rounded-full absolute bottom-0 right-0 border-4 border-white cursor-pointer group-hover:scale-110 transform transition-transform duration-300"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        />
                    </div>
                </div>

                {/* Text Content */}
                <div className="flex flex-col justify-start items-center md:items-start" data-gol-mask>
                    <p className="text-2xl md:text-3xl mb-2 md:mb-3 w-full md:min-w-[310px] lg:min-w-[310px] text-center md:text-left">
                        hey, i'm <TextMorph 
                            targetText={isHoveringSiphyshu ? "siphyshu! 🧑‍💻" : "jaiyank! 👋"}
                            isAnimating={isAnimating}
                        />
                    </p>

                    <p className="text-sm md:text-base mb-1 text-gray-500">
                        {getAge()} y/o{" "}
                        <Image
                            src="/icons/india.png"
                            alt="India flag"
                            width={16}
                            height={16}
                            className="inline h-auto"
                        />・exploring tech × art
                    </p>

                    <p className="text-sm md:text-base mb-1 text-gray-500">
                        building, breaking, always curious.
                    </p>
                </div>
            </div>
            
            {/* Social Links */}
            <LinkPanel />
        </header>
    );
};

export default HeaderSection;