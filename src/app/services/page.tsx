import type { Metadata } from "next";
import { ServiceCard } from "@/components/ServiceCard";
import { EmptyState } from "@/components/EmptyState";
import { copy } from "@/content/en";
import { listServices } from "@/features/services";

export const metadata: Metadata = {
  title: copy.servicesTitle,
};

export default async function ServicesPage() {
  const services = await listServices();

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">{copy.servicesTitle}</h1>
        <p className="lead">{copy.servicesLead}</p>
      </header>
      {services.length === 0 ? (
        <EmptyState icon="wrench">{copy.emptyServices}</EmptyState>
      ) : (
        <ul className="service-grid">
          {services.map((service) => (
            <li key={service.id}>
              <ServiceCard service={service} headingLevel="h2" />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
