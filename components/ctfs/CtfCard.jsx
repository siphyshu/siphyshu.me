"use client";

const STATUS_STYLE = {
    live: "relative pl-4 bg-emerald-100 text-emerald-700 border-emerald-600",
    upcoming: "text-gray-500 border-gray-400",
};

const DIFFICULTY_STYLE = {
    easy: "text-green-600 border-green-600",
    medium: "text-orange-600 border-orange-600",
    hard: "text-red-600 border-red-600",
};

const CtfCard = ({ ctf }) => {
    const isLive = ctf.status === "live";

    return (
        <div className="border border-black shadow-md bg-white font-mono p-4 flex flex-col">
            <div className="flex justify-between items-start">
                <h2 className="text-lg">{ctf.title}</h2>
                <span className="text-sm text-gray-500 whitespace-nowrap ml-2">
                    {ctf.points} pts
                </span>
            </div>

            <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 text-[10px] border rounded-full text-gray-600 border-gray-400">
                    {ctf.category}
                </span>
                <span className={`px-2 py-1 text-[10px] border rounded-full ${DIFFICULTY_STYLE[ctf.difficulty] || ""}`}>
                    {ctf.difficulty}
                </span>
                <span className={`px-2 py-1 text-[10px] border rounded-full ${STATUS_STYLE[ctf.status] || ""}`}>
                    {isLive && (
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    )}
                    {ctf.status}
                </span>
            </div>

            <p className="text-sm text-gray-700 mt-3 flex-1">{ctf.description}</p>

            <div className="mt-4 text-xs space-y-2">
                {ctf.files.length > 0 ? (
                    <div className="text-gray-500">
                        files: {ctf.files.map((f) => (
                            <span key={f} className="underline decoration-dotted mr-2">{f}</span>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-400">files: not released yet</div>
                )}

                {ctf.connect && (
                    <div className="text-gray-500">connect: <span className="text-black">{ctf.connect}</span></div>
                )}
            </div>

            <div className="flex gap-2 mt-4">
                <input
                    type="text"
                    disabled={!isLive}
                    placeholder={isLive ? "flag{...}" : "opens when live"}
                    className="flex-1 border border-black px-2 py-1 text-xs disabled:border-gray-300 disabled:bg-gray-50 disabled:placeholder-gray-400"
                />
                <button
                    disabled
                    className="text-xs px-3 py-1 border border-gray-300 text-gray-400 cursor-not-allowed"
                >
                    submit
                </button>
            </div>
        </div>
    );
};

export default CtfCard;
