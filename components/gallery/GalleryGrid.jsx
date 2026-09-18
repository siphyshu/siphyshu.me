"use client";

import Image from "next/image";
import { gallery } from "@/data/gallery";

const ASPECT_CLASS = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
    wide: "aspect-video",
};

const GalleryGrid = ({ className }) => {
    return (
        <div className={className}>
            <div className="columns-2 md:columns-3 gap-4">
                {gallery.map((item) => (
                    <div
                        key={item.id}
                        className={`relative mb-4 break-inside-avoid group ${ASPECT_CLASS[item.aspect]}`}
                    >
                        <Image
                            src={item.image}
                            alt={item.caption}
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <p className="text-white text-sm font-serif p-2">{item.caption}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GalleryGrid;
