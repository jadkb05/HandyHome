import { LoadingState } from "@/components/EmptyState";
import { copy } from "@/content/en";

export default function ProfessionalProfileLoading() {
  return (
    <>
      <h1 className="page-title">{copy.professionalsTitle}</h1>
      <LoadingState>{copy.loadingProfile}</LoadingState>
    </>
  );
}
