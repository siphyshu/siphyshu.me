import Image from "next/image";

const LINKS = [
  {
    href: "https://github.com/siphyshu",
    text: "GitHub",
    imgSrc: "/images/github-mark.svg",
    imgAlt: "GitHub",
  },
  {
    href: "https://x.com/siphyshu",
    text: "Twitter (X)",
    imgSrc: "/images/twitter_small.png",
    imgAlt: "Twitter",
  },
  {
    href: "https://siphyshu.medium.com",
    text: "Blog",
    imgSrc: "/images/medium_small.png",
    imgAlt: "Medium",
  },
  {
    href: "https://linkedin.com/in/jaiyank-saxena",
    text: "LinkedIn",
    imgSrc: "/images/linkedin_small.png",
    imgAlt: "LinkedIn",
  },
];

export default function LinkPanel() {
  return (
    <div className="flex flex-wrap justify-center gap-4 mb-4">
      {LINKS.map(({ href, text, imgSrc, imgAlt }) => (
        <a
          key={text}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 underline hover:text-blue-800"
        >
          <Image
            src={imgSrc}
            alt={imgAlt}
            width={20}
            height={20}
            className="mr-1"
          />
          {text}
        </a>
      ))}
    </div>
  );
}
