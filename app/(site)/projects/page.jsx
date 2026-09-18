"use client";

import { useState } from "react";
import ProjectGallery from "@/components/projects/ProjectGallery";
import ProjectToolbar from "@/components/projects/ProjectToolbar";
import { useNavActions } from "@/components/ui/NavActionsContext";

// Same view as "/", which is where the nav points and what search engines
// should index — this route exists so the section is linkable on its own.
export default function ProjectsPage() {
  const [tags, setTags] = useState([]);
  useNavActions(<ProjectToolbar tags={tags} setTags={setTags} />);

  return <ProjectGallery tags={tags} />;
}
