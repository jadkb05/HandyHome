import Link from "next/link";
import { copy } from "@/content/en";

export default function ProfessionalNotFound() {
  return (
    <>
      <h1 className="page-title">{copy.notFoundTitle}</h1>
      <p className="lead">{copy.notFoundProfessional}</p>
      <Link href="/professionals" className="button">
        {copy.browseProfessionals}
      </Link>
    </>
  );
}
