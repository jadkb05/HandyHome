import { copy } from "@/content/en";
import { signOutAction } from "@/lib/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="nav-link nav-link--button">
        {copy.navSignOut}
      </button>
    </form>
  );
}
