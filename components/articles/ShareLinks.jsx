"use client";

import { useEffect, useState } from "react";
import { Check, Link2 } from "lucide-react";
import { FaLinkedin, FaXTwitter } from "react-icons/fa6";

// Bare icons, no boxes: a border would make them read as objects (design
// principle 6), and these are just links.
const BUTTON = "flex items-center justify-center w-8 h-8 text-gray-500 hover:text-black transition-colors";

// Copy link, plus the two sites the article is most likely to go to. Each
// site's own share URL (X's post intent, LinkedIn's share-offsite), so there's
// no script from either of them on the page.
export default function ShareLinks({ url, title }) {
    const [copied, setCopied] = useState(false);

    // The tick stands in for the link icon briefly, the same inline "copied"
    // the search palette gives its copy-email row.
    useEffect(() => {
        if (!copied) return;
        const t = setTimeout(() => setCopied(false), 1500);
        return () => clearTimeout(t);
    }, [copied]);

    const encoded = encodeURIComponent(url);
    return (
        <div className="flex gap-1">
            <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(url).then(() => setCopied(true))}
                className={BUTTON}
                aria-label={copied ? "link copied" : "copy link"}
            >
                {copied ? <Check size={16} /> : <Link2 size={16} />}
            </button>
            <a
                href={`https://x.com/intent/post?url=${encoded}&text=${encodeURIComponent(title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={BUTTON}
                aria-label="share on X"
            >
                <FaXTwitter size={14} />
            </a>
            <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
                target="_blank"
                rel="noopener noreferrer"
                className={BUTTON}
                aria-label="share on LinkedIn"
            >
                <FaLinkedin size={15} />
            </a>
        </div>
    );
}
