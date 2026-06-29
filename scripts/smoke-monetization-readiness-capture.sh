#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/smoke-monetization-readiness-capture.sh

Purpose:
  Capture auditable monetization go-live evidence after Stripe, entitlement,
  quota, native purchase, ad suppression, and support checks are observed. This
  script does not call live billing systems. It records operator evidence and
  marks monetization PASS only when every required production proof field is
  explicitly passing.

Optional environment variables:
  EVIDENCE_DIR                     Directory for evidence output (default: artifacts/smoke)
  MONETIZATION_FILE                Explicit monetization evidence file path
  STRIPE_MODE                      Stripe mode observed, usually test or live (default: TODO)
  TESTER                           Monetization tester name (default: TODO)
  REVIEWER                         Release reviewer name (default: TODO)
  NOTES                            Free-form notes (default: TODO)
  STRIPE_CHECKOUT_REF              Checkout Session evidence link/path
  STRIPE_WEBHOOK_REF               Webhook/signature processing evidence link/path
  STRIPE_PORTAL_REF                Customer Portal evidence link/path
  STRIPE_FAILURE_REF               Failed-payment recovery evidence link/path
  STRIPE_REFUND_CANCEL_REF         Refund/cancel/downgrade evidence link/path
  REVENUECAT_REF                   RevenueCat/IAP evidence or deferral note
  ENTITLEMENT_REF                  Backend entitlement reconciliation evidence
  QUOTA_REF                        Backend quota enforcement evidence
  AD_SUPPRESSION_REF               Premium ad suppression evidence
  SUPPORT_REF                      Support/billing visibility evidence

Required PASS fields:
  STRIPE_CHECKOUT_RESULT           PASS when subscription Checkout was verified
  STRIPE_WEBHOOK_RESULT            PASS when signed webhook processing was verified
  STRIPE_PORTAL_RESULT             PASS when Customer Portal self-service was verified
  STRIPE_FAILURE_RESULT            PASS when failed-payment recovery was verified
  STRIPE_REFUND_CANCEL_RESULT      PASS when refund, cancel, and downgrade handling was verified
  ENTITLEMENT_RECONCILIATION_RESULT PASS when backend entitlement reconciliation was verified
  QUOTA_ENFORCEMENT_RESULT         PASS when backend tier quota enforcement was verified
  REVENUECAT_OR_IOS_DEFERRAL_RESULT PASS when RevenueCat/IAP works or native paid features are explicitly deferred
  AD_SUPPRESSION_RESULT            PASS when Premium ad suppression was verified
  SUPPORT_VISIBILITY_RESULT        PASS when support can inspect billing/subscription state

Optional control:
  REQUIRE_PASS=1                   Exit non-zero if any required field is not PASS/YES

Accepted positive values: PASS, YES, TRUE, 1.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

timestamp() {
  date -u +%Y%m%dT%H%M%SZ
}

iso_timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

positive() {
  case "${1:-}" in
    PASS|pass|Pass|YES|yes|Yes|TRUE|true|True|1)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

status_label() {
  if positive "${1:-}"; then
    printf 'PASS'
  else
    printf 'BLOCKED'
  fi
}

EVIDENCE_DIR="${EVIDENCE_DIR:-artifacts/smoke}"
MONETIZATION_FILE="${MONETIZATION_FILE:-}"
STRIPE_MODE="${STRIPE_MODE:-TODO}"
TESTER="${TESTER:-TODO}"
REVIEWER="${REVIEWER:-TODO}"
NOTES="${NOTES:-TODO}"
STRIPE_CHECKOUT_REF="${STRIPE_CHECKOUT_REF:-TODO}"
STRIPE_WEBHOOK_REF="${STRIPE_WEBHOOK_REF:-TODO}"
STRIPE_PORTAL_REF="${STRIPE_PORTAL_REF:-TODO}"
STRIPE_FAILURE_REF="${STRIPE_FAILURE_REF:-TODO}"
STRIPE_REFUND_CANCEL_REF="${STRIPE_REFUND_CANCEL_REF:-TODO}"
REVENUECAT_REF="${REVENUECAT_REF:-TODO}"
ENTITLEMENT_REF="${ENTITLEMENT_REF:-TODO}"
QUOTA_REF="${QUOTA_REF:-TODO}"
AD_SUPPRESSION_REF="${AD_SUPPRESSION_REF:-TODO}"
SUPPORT_REF="${SUPPORT_REF:-TODO}"
REQUIRE_PASS="${REQUIRE_PASS:-0}"

STRIPE_CHECKOUT_RESULT="${STRIPE_CHECKOUT_RESULT:-}"
STRIPE_WEBHOOK_RESULT="${STRIPE_WEBHOOK_RESULT:-}"
STRIPE_PORTAL_RESULT="${STRIPE_PORTAL_RESULT:-}"
STRIPE_FAILURE_RESULT="${STRIPE_FAILURE_RESULT:-}"
STRIPE_REFUND_CANCEL_RESULT="${STRIPE_REFUND_CANCEL_RESULT:-}"
ENTITLEMENT_RECONCILIATION_RESULT="${ENTITLEMENT_RECONCILIATION_RESULT:-}"
QUOTA_ENFORCEMENT_RESULT="${QUOTA_ENFORCEMENT_RESULT:-}"
REVENUECAT_OR_IOS_DEFERRAL_RESULT="${REVENUECAT_OR_IOS_DEFERRAL_RESULT:-}"
AD_SUPPRESSION_RESULT="${AD_SUPPRESSION_RESULT:-}"
SUPPORT_VISIBILITY_RESULT="${SUPPORT_VISIBILITY_RESULT:-}"

stamp="$(timestamp)"
mkdir -p "$EVIDENCE_DIR"

if [[ -z "$MONETIZATION_FILE" ]]; then
  MONETIZATION_FILE="$EVIDENCE_DIR/monetization-readiness-$stamp.log"
else
  mkdir -p "$(dirname "$MONETIZATION_FILE")"
fi

overall_pass=1
for value in \
  "$STRIPE_CHECKOUT_RESULT" \
  "$STRIPE_WEBHOOK_RESULT" \
  "$STRIPE_PORTAL_RESULT" \
  "$STRIPE_FAILURE_RESULT" \
  "$STRIPE_REFUND_CANCEL_RESULT" \
  "$ENTITLEMENT_RECONCILIATION_RESULT" \
  "$QUOTA_ENFORCEMENT_RESULT" \
  "$REVENUECAT_OR_IOS_DEFERRAL_RESULT" \
  "$AD_SUPPRESSION_RESULT" \
  "$SUPPORT_VISIBILITY_RESULT"; do
  if ! positive "$value"; then
    overall_pass=0
  fi
done

overall_status="BLOCKED"
if [[ "$overall_pass" -eq 1 ]]; then
  overall_status="PASS"
fi

cat > "$MONETIZATION_FILE" <<EOF
Monetization Go-Live Readiness Log
Generated: $(iso_timestamp)

Stripe Mode Observed: $STRIPE_MODE

Checklist:
[$(status_label "$STRIPE_CHECKOUT_RESULT")] Stripe subscription Checkout Session verified
[$(status_label "$STRIPE_WEBHOOK_RESULT")] Stripe webhook signature verification and subscription event processing verified
[$(status_label "$STRIPE_PORTAL_RESULT")] Stripe Customer Portal billing management verified
[$(status_label "$STRIPE_FAILURE_RESULT")] Stripe failed-payment recovery verified
[$(status_label "$STRIPE_REFUND_CANCEL_RESULT")] Refund, cancellation, and downgrade handling verified
[$(status_label "$ENTITLEMENT_RECONCILIATION_RESULT")] Backend entitlement reconciliation verified
[$(status_label "$QUOTA_ENFORCEMENT_RESULT")] Backend quota enforcement verified
[$(status_label "$REVENUECAT_OR_IOS_DEFERRAL_RESULT")] RevenueCat/IAP path verified or native paid features explicitly deferred
[$(status_label "$AD_SUPPRESSION_RESULT")] Premium ad suppression verified
[$(status_label "$SUPPORT_VISIBILITY_RESULT")] Support billing visibility and escalation path verified

Evidence references:
- Stripe Checkout: $STRIPE_CHECKOUT_REF
- Stripe webhooks: $STRIPE_WEBHOOK_REF
- Stripe Customer Portal: $STRIPE_PORTAL_REF
- Failed-payment recovery: $STRIPE_FAILURE_REF
- Refund/cancel/downgrade: $STRIPE_REFUND_CANCEL_REF
- RevenueCat/IAP or deferral: $REVENUECAT_REF
- Backend entitlements: $ENTITLEMENT_REF
- Backend quotas: $QUOTA_REF
- Premium ad suppression: $AD_SUPPRESSION_REF
- Support visibility: $SUPPORT_REF

Result Summary:
- Status: $overall_status
- Tester: $TESTER
- Reviewer: $REVIEWER
- Notes: $NOTES
EOF

echo "Created monetization evidence: $MONETIZATION_FILE"
echo "Monetization readiness status: $overall_status"

if [[ "$overall_status" != "PASS" && "$REQUIRE_PASS" == "1" ]]; then
  echo "FAIL: Monetization readiness is not PASS. Complete all required billing, entitlement, quota, native purchase/deferral, ads, and support proof fields." >&2
  exit 1
fi
