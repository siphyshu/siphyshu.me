'use client'

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import TextMorph from "@/components/hero/TextMorph";
import LightSwitch from "@/components/ui/LightSwitch";
import { TABS } from "@/components/ui/NavBar";

// The site's header on pages that don't carry the hero and the wall — an
// article, for now. The homepage hero shrunk to one line: who this is (a link
// home) and where else to go. It scrolls away with the page rather than
// sticking, so nothing sits over the text while reading.
export default function CompactHeader() {
    const pathname = usePathname();
    const [isHovering, setIsHovering] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Same play as the hero: hover the name and it scrambles into the handle.
    const hover = (on) => {
        setIsHovering(on);
        setIsAnimating(true);
    };

    return (
        <header
            className="flex justify-between items-center gap-4 pt-8 md:pt-12 pb-3 border-b border-black"
            data-gol-mask
        >
            <Link
                href="/"
                className="flex items-center gap-2 md:gap-3 shrink-0"
                onMouseEnter={() => hover(true)}
                onMouseLeave={() => hover(false)}
            >
                <Image
                    src="/images/jaiyank.jpg"
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-full w-7 h-7 md:w-8 md:h-8"
                />
                {/* Fixed width so the section links don't shift while
                    "jaiyank" and "siphyshu" trade places. */}
                <span className="text-lg md:text-xl w-[4.75em]">
                    <TextMorph
                        targetText={isHovering ? "siphyshu" : "jaiyank"}
                        isAnimating={isAnimating}
                    />
                </span>
            </Link>

            <div className="flex items-center gap-3 md:gap-5">
                <nav>
                    <ul className="flex gap-3 md:gap-5">
                        {TABS.map(({ label, href, match }) => {
                            // Inside a section (/articles/<slug>) counts as being
                            // in it; only the section's own page is the page.
                            const isPage = match.includes(pathname);
                            const isSection = isPage || pathname.startsWith(`${href}/`);
                            return (
                                <li key={label}>
                                    <Link
                                        href={href}
                                        aria-current={isPage ? "page" : isSection ? "true" : undefined}
                                        className={`text-base md:text-lg ${isSection ? "underline" : "text-gray-500 hover:text-black"}`}
                                    >
                                        {label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
                {/* The plate alone at the far right; the footer's switch, which
                    carries the label, is hidden on reader pages. */}
                <LightSwitch label={false} />
            </div>
        </header>
    );
}
