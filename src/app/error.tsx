"use client";

import Link from "next/link";
import { copy } from "@/content/en";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <h1 className="page-title">{copy.errorTitle}</h1>
      <p className="lead">{copy.errorBody}</p>
      <div className="stack">
        <button type="button" className="button" onClick={reset}>
          {copy.errorRetry}
        </button>
        <Link href="/" className="button button-secondary">
          {copy.notFoundAction}
        </Link>
      </div>
    </>
  );
}
