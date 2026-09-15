import ProjectGallery from "@/components/projects/ProjectGallery";
import { getProjects } from "@/lib/content";

export default async function Home() {
  return <ProjectGallery projects={await getProjects()} />;
}
