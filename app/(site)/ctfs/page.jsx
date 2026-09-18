"use client";

import { useState } from "react";
import CtfList from "@/components/ctfs/CtfList";
import CtfToolbar from "@/components/ctfs/CtfToolbar";
import { useNavActions } from "@/components/ui/NavActionsContext";

export default function CtfsPage() {
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  useNavActions(
    <CtfToolbar
      categories={categories}
      setCategories={setCategories}
      statuses={statuses}
      setStatuses={setStatuses}
    />
  );

  return <CtfList categories={categories} statuses={statuses} />;
}
