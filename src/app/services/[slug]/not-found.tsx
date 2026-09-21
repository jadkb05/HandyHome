import Link from "next/link";
import { copy } from "@/content/en";

export default function ServiceNotFound() {
  return (
    <>
      <h1 className="page-title">{copy.notFoundTitle}</h1>
      <p className="lead">{copy.notFoundService}</p>
      <Link href="/services" className="button">
        {copy.browseServices}
      </Link>
    </>
  );
}
