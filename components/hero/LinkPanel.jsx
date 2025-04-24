import Image from "next/image";
import { FaGithub, FaMedium, FaLinkedin, FaTwitterSquare, FaRssSquare } from "react-icons/fa";

const LINKS = [
  {
    href: "https://github.com/siphyshu",
    text: "GitHub",
    imgSrc: "/icons/github-mark.svg",
    imgAlt: "GitHub",
    icon: FaGithub,
  },
  {
    href: "https://x.com/siphyshu",
    text: "Twitter (X)",
    imgSrc: "/icons/twitter_small.png",
    imgAlt: "Twitter",
    icon: FaTwitterSquare,
  },
  {
    href: "https://siphyshu.medium.com",
    text: "Blog",
    imgSrc: "/icons/medium_small.png",
    imgAlt: "Medium",
    // icon: FaMedium,
    icon: FaRssSquare,
  },
  {
    href: "https://linkedin.com/in/jaiyank-saxena",
    text: "LinkedIn",
    imgSrc: "/icons/linkedin_small.png",
    imgAlt: "LinkedIn",
    icon: FaLinkedin,
  },
];

export default function LinkPanel() {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {LINKS.map(({ href, text, imgSrc, imgAlt, icon: Icon }) => (
        <a
          key={text}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 underline hover:text-blue-800"
        >
          {Icon ? (
            <Icon className="mr-1 w-5 h-5 text-black" />
          ) : (
            <Image
              src={imgSrc}
              alt={imgAlt}
              width={20}
              height={20}
              className="mr-1"
            />
          )}
          {text}
        </a>
      ))}
    </div>
  );
}
