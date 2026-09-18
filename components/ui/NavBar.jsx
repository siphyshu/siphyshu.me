'use client'

const NavBar = ({activeTab, setActiveTab, actions}) => {
    return (
        <nav className="mb-8">
            <div className="flex justify-between items-baseline gap-6 pb-3 border-b border-black">
                <ul className="flex gap-6">
                    <li>
                        <button
                        onClick={() => setActiveTab("projects")}
                        className={`text-xl md:text-2xl ${activeTab === "projects" ? "underline" : "text-gray-500"}`}
                        >
                        projects
                        </button>
                    </li>
                    <li>
                        <button
                        onClick={() => setActiveTab("articles")}
                        className={`text-xl md:text-2xl ${activeTab === "articles" ? "underline" : "text-gray-500"}`}
                        >
                        articles
                        </button>
                    </li>
                    <li>
                        <button
                        onClick={() => setActiveTab("gallery")}
                        className={`text-xl md:text-2xl ${activeTab === "gallery" ? "underline" : "text-gray-500"}`}
                        >
                        gallery
                        </button>
                    </li>
                    <li>
                        <button
                        onClick={() => setActiveTab("ctfs")}
                        className={`text-xl md:text-2xl ${activeTab === "ctfs" ? "underline" : "text-gray-500"}`}
                        >
                        ctfs
                        </button>
                    </li>
                </ul>
                {actions && <div className="hidden sm:block shrink-0">{actions}</div>}
            </div>
        </nav>
    );
};

export default NavBar;
