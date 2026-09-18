"use client";

import GameRow from "@/components/games/GameRow";
import { games } from "@/data/games";
import { tags } from "@/data/tags";

const GameList = ({ className }) => {
    return (
        <div className={`flex flex-col justify-start ${className}`}>
            <div>
                {games.map((game, index) => (
                    <div key={game.id}>
                        <GameRow
                            game={{
                                ...game,
                                resolvedTags: game.tags
                                    .map((tagId) => tags[tagId])
                                    .filter(Boolean),
                            }}
                        />
                        {index < games.length - 1 && (
                            <hr className="my-4 border-gray-300" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GameList;
