import {verifyPremiumReceipt} from "./premium.provider";

export interface BillingPurchaseVerificationInput {
  productId: string;
  source: string;
  receipt: string;
}

export interface BillingVerificationResult {
  verified: boolean;
  verificationState: string;
  provider: string;
  reason?: string;
}

export async function verifyBillingPurchase(
  input: BillingPurchaseVerificationInput
): Promise<BillingVerificationResult> {
  const normalizedSource = (input.source || "unknown").toString();

  // Current implementation delegates to premium receipt verification.
  // The abstraction allows future Stripe/enterprise invoice providers.
  if (input.productId === "premium_ad_free") {
    const verification = await verifyPremiumReceipt({
      productId: input.productId,
      source: normalizedSource,
      receipt: input.receipt,
    });

    return {
      verified: verification.verified,
      verificationState: verification.verificationState,
      provider: verification.provider,
      reason: verification.reason,
    };
  }

  return {
    verified: false,
    verificationState: "unsupported_product",
    provider: "billing_abstraction",
    reason: "Unsupported product for billing verification",
  };
}
