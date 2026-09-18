"use client";

import { useState } from "react";
import ArticleList from "@/components/articles/ArticleList";
import ArticleToolbar from "@/components/articles/ArticleToolbar";
import { useNavActions } from "@/components/ui/NavActionsContext";

export default function ArticlesPage() {
  const [tags, setTags] = useState([]);
  const [order, setOrder] = useState(null);
  useNavActions(
    <ArticleToolbar tags={tags} setTags={setTags} order={order} setOrder={setOrder} />
  );

  return <ArticleList tags={tags} order={order} />;
}
