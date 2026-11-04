"use client";

import { useState } from "react";
import ArticleList from "@/components/articles/ArticleList";
import ArticleToolbar from "@/components/articles/ArticleToolbar";
import { useNavActions } from "@/components/ui/NavActionsContext";

export default function ArticlesPage() {
  const [tags, setTags] = useState([]);
  const [kind, setKind] = useState(null);
  const [order, setOrder] = useState(null);
  useNavActions(
    <ArticleToolbar
      tags={tags}
      setTags={setTags}
      kind={kind}
      setKind={setKind}
      order={order}
      setOrder={setOrder}
    />
  );

  return <ArticleList tags={tags} kind={kind} order={order} />;
}
