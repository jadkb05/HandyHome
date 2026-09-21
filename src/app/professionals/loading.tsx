import { LoadingState } from "@/components/EmptyState";
import { copy } from "@/content/en";

export default function ProfessionalsLoading() {
  return (
    <>
      <h1 className="page-title">{copy.professionalsHeading}</h1>
      <LoadingState>{copy.loadingProfessionals}</LoadingState>
    </>
  );
}
