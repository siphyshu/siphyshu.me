import ProjectGallery from "@/components/projects/ProjectGallery";

// Same view as "/", which is where the nav points and what search engines
// should index — this route exists so the section is linkable on its own.
export const metadata = {
  title: "projects // siphyshu",
  alternates: { canonical: "/" },
};

export default function ProjectsPage() {
  return <ProjectGallery />;
}
