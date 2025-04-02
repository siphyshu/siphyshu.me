'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import LinkPanel from "@/components/hero/LinkPanel";

const HeaderSection = () => {
    return (
        <header className="text-center mt-24">
            <p className="text-2xl mb-3">hey, i'm jaiyank! 👋</p>
            
            {/* Profile Pics */}
            <div className="flex items-center justify-center gap-3 mb-3">
                <div className="relative rounded-full">
                    <Image
                        src="/images/jaiyank.jpg"
                        alt="siphyshu"
                        fill
                        priority={true}
                        className="mx-auto rounded-full"
                    />
                </div>
                <div className="relative rounded-full">
                    <Image
                        src="/images/siphyshu.jpg"
                        alt="siphyshu"
                        fill
                        priority={true}
                        className="mx-auto rounded-full"
                    />
                </div>
            </div>

            {/* Bio */}
            <div className="text-base mb-3">
              20 y/o{" "}
              <Image
                src="/images/icons/india.png"
                alt="India flag"
                width={16}
                height={16}
                className="inline h-auto"
              />・exploring CS @ VITB
            </div>
            
            {/* Social Links */}
            <LinkPanel />

            {/* Search Bar */}
            <div className="w-full max-w-md mb-8 mx-auto">
                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full border border-gray-300 px-3 py-2 text-sm"
                />
            </div>
        </header>
    );
};

export default HeaderSection;