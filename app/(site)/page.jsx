"use client";

import { useState } from "react";
import ProjectGallery from "@/components/projects/ProjectGallery";
import ProjectToolbar from "@/components/projects/ProjectToolbar";
import { useNavActions } from "@/components/ui/NavActionsContext";

export default function Home() {
  const [tags, setTags] = useState([]);
  useNavActions(<ProjectToolbar tags={tags} setTags={setTags} />);

  return <ProjectGallery tags={tags} />;
}
