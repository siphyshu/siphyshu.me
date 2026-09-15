import ArticleList from "@/components/articles/ArticleList";
import { getArticles } from "@/lib/content";

export const metadata = {
  title: "articles // siphyshu",
};

export default async function ArticlesPage() {
  return <ArticleList articles={await getArticles()} />;
}
