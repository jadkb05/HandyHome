import type { Metadata } from "next";
import Link from "next/link";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import { copy } from "@/content/en";
import { getProviderByUserId } from "@/features/professionals";
import { listServices } from "@/features/services";
import { requirePageRole, UserRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: copy.profileEditTitle,
};

export default async function ProfessionalProfileEditPage() {
  const user = await requirePageRole(UserRole.PROFESSIONAL);
  const [provider, services] = await Promise.all([getProviderByUserId(user.userId), listServices()]);

  return (
    <section className="auth-panel auth-card">
      <h1 className="page-title">{copy.profileEditTitle}</h1>
      <p className="lead">{copy.profileEditLead}</p>
      {provider ? (
        <>
          <p>
            <Link href={`/professionals/${provider.id}`}>{copy.viewPublicProfile}</Link>
          </p>
          <ProfileEditForm
            profession={provider.profession}
            description={provider.description ?? ""}
            city={provider.city}
            services={services.map((service) => ({ id: service.id, name: service.name }))}
            selectedServiceIds={provider.services.map((item) => item.serviceId)}
          />
        </>
      ) : (
        <p className="empty-state">{copy.emptyProfessionals}</p>
      )}
    </section>
  );
}
