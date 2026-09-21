import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { copy } from "@/content/en";
import { AUTH_ARTISAN_IMAGE } from "@/content/media";

export function AuthMarketingPanel() {
  return (
    <aside className="auth-aside" aria-hidden="true">
      <div className="auth-aside__copy">
        <p className="auth-aside__title">{copy.authAsideTitle}</p>
        <ul className="auth-aside__list">
          <li>
            <Icon name="check" size={18} />
            {copy.authAside1}
          </li>
          <li>
            <Icon name="check" size={18} />
            {copy.authAside2}
          </li>
          <li>
            <Icon name="check" size={18} />
            {copy.authAside3}
          </li>
        </ul>
      </div>
      <div className="auth-aside__art" data-testid="auth-artisan">
        <Image
          src={AUTH_ARTISAN_IMAGE.src}
          alt=""
          fill
          sizes="(min-width: 64rem) 30rem, 12rem"
          className="auth-aside__image"
          priority
        />
      </div>
    </aside>
  );
}
