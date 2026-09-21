export type PaymentCommand = {
  bookingId: string;
  quoteId: string;
  amount: string;
  currency: string;
};

export type PaymentService = {
  readonly providerName: string;
};

export class PaymentProviderNotSelectedError extends Error {
  constructor() {
    super("Payment provider is not locked (OPEN_QUESTIONS B-10 / T-04 related).");
    this.name = "PaymentProviderNotSelectedError";
  }
}

export function getPaymentService(): PaymentService {
  throw new PaymentProviderNotSelectedError();
}
