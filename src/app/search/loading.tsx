import { LoadingState } from "@/components/EmptyState";
import { copy } from "@/content/en";

export default function SearchLoading() {
  return (
    <>
      <h1 className="page-title">{copy.searchTitle}</h1>
      <LoadingState>{copy.searchLoading}</LoadingState>
    </>
  );
}
