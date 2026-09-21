import Link from "next/link";
import { copy } from "@/content/en";

export default function NotFound() {
  return (
    <>
      <h1 className="page-title">{copy.notFoundTitle}</h1>
      <p className="lead">{copy.notFoundBody}</p>
      <Link href="/" className="button">
        {copy.notFoundAction}
      </Link>
    </>
  );
}
