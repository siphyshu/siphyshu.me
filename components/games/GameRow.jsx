"use client";

import Image from "next/image";
import { FaGithub } from "react-icons/fa";
import { tagColorVariants } from "@/data/tags";

function actionFor(game) {
    switch (game.platform) {
        case "web":
            return { label: "play", href: game.playUrl };
        case "hardware":
            return { label: "watch demo", href: game.demoVideo };
        case "python":
            return { label: "run locally", href: game.links?.github };
        case "discord":
            return { label: "join server", href: game.discordInvite };
        default:
            return { label: null, href: null };
    }
}

const GameRow = ({ game }) => {
    const { label, href } = actionFor(game);

    return (
        <div className="flex gap-4">
            <div className="relative w-16 h-16 shrink-0 border border-black">
                <Image src={game.thumbnail} alt={game.title} fill className="object-cover" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                    <h2 className="text-black prose prose-lg">{game.title}</h2>
                    {game.links?.github && (
                        <a href={game.links.github} target="_blank" rel="noopener noreferrer">
                            <FaGithub className="text-gray-800 text-sm cursor-pointer" />
                        </a>
                    )}
                </div>

                <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="px-2 py-1 text-[10px] font-mono border rounded-full border-black text-black">
                        {game.platform}
                    </span>
                    {game.resolvedTags.map((tag, i) => (
                        <span
                            key={i}
                            className={`px-2 py-1 text-[10px] border rounded-full ${tagColorVariants[tag.color]}`}
                        >
                            {tag.name}
                        </span>
                    ))}
                </div>

                <p className="text-gray text-sm mt-2 prose prose-sm">{game.description}</p>

                <div className="mt-2">
                    {href ? (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs underline decoration-dotted underline-offset-2 hover:decoration-solid active:text-gray-600 transition-colors"
                        >
                            {label}
                        </a>
                    ) : (
                        <span className="font-mono text-xs text-gray-400">{label} (coming soon)</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameRow;
