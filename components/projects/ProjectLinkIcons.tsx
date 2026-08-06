import Image from "next/image";
import { FaGithub } from "react-icons/fa";

interface ProjectLinkIconsProps {
  links: Record<string, string>;
  size?: "sm" | "md";
}

export default function ProjectLinkIcons({ links, size = "md" }: ProjectLinkIconsProps) {
  const iconPx = size === "sm" ? 16 : 18;
  const iconMap: Record<string, React.ReactNode> = {
    github: <FaGithub className={`text-gray-800 ${size === "sm" ? "text-lg" : "text-2xl"} cursor-pointer`} />,
    external: (
      <Image
        src="/icons/external_link.svg"
        alt="External Link"
        width={iconPx}
        height={iconPx}
        className="cursor-pointer"
      />
    ),
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      {Object.entries(links).map(([key, url]) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {iconMap[key] || (
            <span className="text-gray-800 text-sm cursor-pointer">{key}</span>
          )}
        </a>
      ))}
    </div>
  );
}
