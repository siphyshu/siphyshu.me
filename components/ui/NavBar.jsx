'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavActionsValue } from "@/components/ui/NavActionsContext";

// "/" and "/projects" are the same view — the bare domain still opens on
// projects, and /projects exists so the section has a shareable URL of its own.
const TABS = [
    { label: "projects", href: "/", match: ["/", "/projects"] },
    { label: "articles", href: "/articles", match: ["/articles"] },
    { label: "gallery", href: "/gallery", match: ["/gallery"] },
    { label: "ctfs", href: "/ctfs", match: ["/ctfs"] },
];

const NavBar = () => {
    const pathname = usePathname();
    const actions = useNavActionsValue();

    return (
        <nav className="mb-8">
            <div className="flex justify-between items-baseline gap-6 pb-3 border-b border-black">
                <ul className="flex gap-6">
                    {TABS.map(({ label, href, match }) => {
                        const isActive = match.includes(pathname);
                        return (
                            <li key={label}>
                                {/* scroll={false} keeps the page where it is, the way
                                    switching tabs always has */}
                                <Link
                                    href={href}
                                    scroll={false}
                                    aria-current={isActive ? "page" : undefined}
                                    className={`text-xl md:text-2xl ${isActive ? "underline" : "text-gray-500"}`}
                                >
                                    {label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
                {actions && <div className="hidden sm:block shrink-0">{actions}</div>}
            </div>
        </nav>
    );
};

export default NavBar;
