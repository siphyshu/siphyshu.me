'use client'

import Link from 'next/link';

const NavBar = ({activeTab, setActiveTab}) => {
    return (
        <nav className="mb-8">
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
            </ul>
        </nav>
    );
};

export default NavBar;