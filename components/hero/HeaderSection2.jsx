'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import LinkPanel from "@/components/hero/LinkPanel";

const TextMorph = ({ targetText, isAnimating }) => {
    const [displayText, setDisplayText] = useState(targetText);
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    
    useEffect(() => {
        if (!isAnimating) {
            setDisplayText(targetText);
            return;
        }

        const textPart = targetText.split(' ').slice(0, -1).join(' ');
        const emojiPart = targetText.split(' ').slice(-1)[0];

        let steps = 0;
        const maxSteps = 10; // Increased for smoother transition
        
        // Smoother easing function with more pronounced curve
        const easeInOut = (t) => {
            if ( t <= 0.5 ) {
                return 2.0 * t * t;
            }

            t -= 0.5;
            return 1 - Math.pow(1 - t, 100);
        }
    

        const interval = setInterval(() => {
            if (steps >= maxSteps) {
                setDisplayText(targetText);
                clearInterval(interval);
                return;
            }

            const progress = easeInOut(steps / maxSteps);

            const scrambled = textPart
                .split('')
                .map((char, index) => {
                    if (char === ' ' || char === ',' || char === '!' || char === "'") return char;
                    
                    // More gradual character reveal
                    if (Math.random() < progress * 1.5) return textPart[index];
                    
                    // Use character set closer to the final character for smoother transition
                    const randomChar = Math.random() < progress 
                        ? characters[Math.floor(Math.random() * 5) + characters.indexOf(textPart[index].toLowerCase()) - 2]
                        : characters[Math.floor(Math.random() * characters.length)];
                    return randomChar || textPart[index];
                })
                .join('');

            setDisplayText(`${scrambled} ${emojiPart}`);
            steps++;
        }, 70); // Adjusted timing for smoother animation

        return () => clearInterval(interval);
    }, [targetText, isAnimating]);

    return displayText;
};

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
        <header className="text-center mt-32">
            
            {/* Bio Section */}
            <div className="flex flex-row justify-center gap-6 mb-3">
                <div className="w-[10px]"></div> {/* Spacer */}
                {/* Profile Pics */}
                <div className="relative rounded-full">
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

                <div className="flex flex-col justify-start items-start">
                    {/* <p className="text-3xl mb-3 min-w-fit text-left"> */}
                    <p className="text-3xl mb-3 w-full md:min-w-[310px] lg:min-w-[310px] text-left">
                        hey, i'm <TextMorph 
                            targetText={isHoveringSiphyshu ? "siphyshu! 🧑‍💻" : "jaiyank! 👋"}
                            isAnimating={isAnimating}
                        />
                    </p>

                    <p className="text-base mb-1 text-gray-500">
                      21 y/o{" "}
                      <Image
                        src="/icons/india.png"
                        alt="India flag"
                        width={16}
                        height={16}
                        className="inline h-auto"
                      />・exploring CS @ VITB
                    </p>

                    <p className="text-base mb-1 text-gray-500">
                        Deep tech generalist, building XYZ
                    </p>
                </div>
                
            </div>
            
            {/* Social Links */}
            <LinkPanel />
        </header>
    );
};

export default HeaderSection;