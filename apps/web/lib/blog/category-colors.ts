import type { ArticleCategory } from "./articles";

export const categoryColors: Record<ArticleCategory | string, string> = {
  sleep: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  focus: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  energy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  fitness: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  general: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};
