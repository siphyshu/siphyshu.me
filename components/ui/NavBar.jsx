'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavActionsValue } from "@/components/ui/NavActionsContext";

// "/" and "/projects" are the same view — the bare domain still opens on
// projects, and /projects exists so the section has a shareable URL of its
// own. The tab itself links to /projects (not /) so clicking it always shows
// that URL, even though visiting "/" directly renders the same page.
//
// gallery and ctfs are parked out of the nav for now — the routes and
// components still exist (app/(site)/gallery, app/(site)/ctfs), they just
// aren't live/linked until there's real content, same treatment as games.
const TABS = [
    { label: "projects", href: "/projects", match: ["/", "/projects"] },
    { label: "articles", href: "/articles", match: ["/articles"] },
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
