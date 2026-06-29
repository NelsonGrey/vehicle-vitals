"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStripeCheckoutSession = createStripeCheckoutSession;
exports.verifyBillingPurchase = verifyBillingPurchase;
const premium_provider_1 = require("./premium.provider");
function getStripePriceId(tier, billingPeriod) {
    let envName = "STRIPE_PRICE_ID_PREMIUM_MONTHLY";
    if (tier === "pro" && billingPeriod === "annual") {
        envName = "STRIPE_PRICE_ID_PRO_ANNUAL";
    }
    else if (tier === "pro") {
        envName = "STRIPE_PRICE_ID_PRO_MONTHLY";
    }
    else if (billingPeriod === "annual") {
        envName = "STRIPE_PRICE_ID_PREMIUM_ANNUAL";
    }
    return (process.env[envName] || "").toString().trim();
}
function requireStripeSecretKey() {
    const key = (process.env.STRIPE_SECRET_KEY || "").toString().trim();
    if (!key) {
        throw new Error("STRIPE_SECRET_KEY not configured");
    }
    return key;
}
async function createStripeCheckoutSession(input) {
    var _a;
    const secretKey = requireStripeSecretKey();
    const priceId = getStripePriceId(input.tier, input.billingPeriod);
    if (!priceId) {
        throw new Error(`Stripe price id missing for ${input.tier}:${input.billingPeriod}`);
    }
    const form = new URLSearchParams();
    form.set("mode", "subscription");
    form.set("line_items[0][price]", priceId);
    form.set("line_items[0][quantity]", "1");
    form.set("success_url", input.successUrl);
    form.set("cancel_url", input.cancelUrl);
    form.set("client_reference_id", input.uid);
    form.set("metadata[uid]", input.uid);
    form.set("metadata[targetTier]", input.tier);
    form.set("metadata[billingPeriod]", input.billingPeriod);
    form.set("subscription_data[metadata][uid]", input.uid);
    form.set("subscription_data[metadata][targetTier]", input.tier);
    form.set("subscription_data[metadata][billingPeriod]", input.billingPeriod);
    const trimmedCustomerEmail = (input.customerEmail || "").trim();
    if (trimmedCustomerEmail) {
        form.set("customer_email", trimmedCustomerEmail);
    }
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${secretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = (((_a = payload === null || payload === void 0 ? void 0 : payload.error) === null || _a === void 0 ? void 0 : _a.message) || "Stripe checkout session creation failed").toString();
        throw new Error(`Stripe checkout error (${response.status}): ${message}`);
    }
    const sessionId = ((payload === null || payload === void 0 ? void 0 : payload.id) || "").toString();
    const checkoutUrl = ((payload === null || payload === void 0 ? void 0 : payload.url) || "").toString();
    if (!sessionId || !checkoutUrl) {
        throw new Error("Stripe checkout response missing id or url");
    }
    return {
        sessionId,
        checkoutUrl,
        customerId: ((payload === null || payload === void 0 ? void 0 : payload.customer) || "").toString(),
        subscriptionId: ((payload === null || payload === void 0 ? void 0 : payload.subscription) || "").toString(),
    };
}
async function verifyBillingPurchase(input) {
    const normalizedSource = (input.source || "unknown").toString();
    // Current implementation delegates to premium receipt verification.
    // The abstraction allows future Stripe/enterprise invoice providers.
    if (input.productId === "premium_ad_free") {
        const verification = await (0, premium_provider_1.verifyPremiumReceipt)({
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
//# sourceMappingURL=billing.provider.js.map