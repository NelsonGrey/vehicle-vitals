#!/usr/bin/env python3
"""Manages the Google Play subscription catalog via the Android Publisher
API's `monetization.subscriptions` resource (with an embedded base plan per
subscription). This is the Android counterpart to
packages/mobile/ios/fastlane/scripts/manage_subscriptions.rb.

Unlike the one-time-product `remove_ads` catalog (see manage-play-iap.py),
the four products here are auto-renewable SUBSCRIPTIONS -- a different,
more structured resource shape: a Subscription has one or more embedded
BasePlans, each with its own regional pricing and its own DRAFT/ACTIVE
lifecycle (activated via a separate `basePlans.activate` call, not covered
by this script -- see the module-level scope note below).

Product catalog (must match packages/mobile/lib/services/premium_service.dart
_androidProductCatalog and packages/functions/src/billing.provider.ts
IAP_PRODUCT_CATALOG). Each catalog entry here is modeled as its own
Play "subscription" resource (not as multiple base plans under one shared
subscription) because the Flutter client already queries these four exact
strings as flat product IDs -- this is the structure that matches what the
client actually asks Play Billing for:
  pro_android_month       pro tier,     monthly, $2.99/mo
  pro_android_annual      pro tier,     annual,  $29.99/yr
  premium_android_month   premium tier, monthly, $6.99/mo
  premium_android_annual  premium tier, annual,  $69.99/yr

IMPORTANT API quirks (consistent with manage-play-iap.py's findings, and
worth re-confirming here since the subscriptions resource is a distinct
code path in Google's API, not just a renamed copy of oneTimeProducts):
  - Despite `subscriptions` being nested under `monetization` in the
    discovery document's resource tree (and in Google's own client-library
    naming, e.g. `androidpublisher.monetization().subscriptions()`), the
    actual REST path has NO `/monetization/` segment -- it's
    `.../applications/{packageName}/subscriptions`, not
    `.../applications/{packageName}/monetization/subscriptions`. The
    latter 404s with a generic Google error page (not a JSON error body).
    Confirmed by reading the `path` field directly off each method in the
    discovery doc rather than inferring it from the resource nesting.
  - `regionsVersion.version` is a QUERY parameter on both `create` and
    `patch`, not a body field, obtained via `pricing:convertRegionPrices`.
  - Base plans are NOT created via a separate endpoint -- there is no
    `subscriptions.basePlans.create` method. They are embedded directly in
    the `basePlans` array of the Subscription resource body passed to
    `subscriptions.create` (or `.patch`).
  - A newly created base plan starts in DRAFT state automatically and is
    NOT purchasable until a separate, explicit
    `subscriptions.basePlans.activate` call -- this script deliberately
    does not call it. Making a real subscription purchasable for money is
    a human decision, out of scope for this session (mirrors the identical
    boundary in manage-play-iap.py's `activate-offer`).
  - `regionalConfigs[].newSubscriberAvailability` must be explicitly true
    for a region for the base plan to actually be offered there once
    activated; this script sets it true for US only, to keep the draft
    creation call small (a real go-live would want the full
    multi-territory list, same caveat as manage-play-iap.py).

Usage:
  manage-play-subscriptions.py status [product_id]     # read-only
  manage-play-subscriptions.py create-draft             # create any of the
                                                          # four catalog
                                                          # products that
                                                          # don't already
                                                          # exist, each with
                                                          # one DRAFT base
                                                          # plan and a real
                                                          # US price.
"""

import argparse
import json
import subprocess
import sys
import urllib.parse

PACKAGE_NAME = "com.vehiclevitals.app.android"
API_BASE = f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{PACKAGE_NAME}"


def resolve_service_account():
    """Determine which activated gcloud identity to use. Prefers
    GOOGLE_PLAY_SA_ACCOUNT (an already-activated account email) if set;
    otherwise derives client_email from GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (the
    key content, as GitHub Actions provides it) and activates it. Avoids
    hardcoding a guessed service-account name, which would silently be wrong
    for any project whose Play service account isn't named exactly that."""
    import os

    account = os.environ.get("GOOGLE_PLAY_SA_ACCOUNT")
    if account:
        return account

    key_json = os.environ.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON")
    if not key_json:
        print(
            "Set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (key content) or GOOGLE_PLAY_SA_ACCOUNT "
            "(pre-activated account email).",
            file=sys.stderr,
        )
        sys.exit(1)

    import tempfile
    key = json.loads(key_json)
    account = key["client_email"]
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        f.write(key_json)
        key_file = f.name
    subprocess.run(
        ["gcloud", "auth", "activate-service-account", account, f"--key-file={key_file}"],
        check=True,
    )
    return account


SA_ACCOUNT = None  # resolved lazily on first get_token() call

CATALOG = {
    "pro_android_month": {
        "title": "Pro Monthly",
        "description": "Pro plan, billed monthly. Higher vehicle limit and Pro features.",
        "base_plan_id": "monthly",
        "billing_period": "P1M",
        "price": "2.99",
    },
    "pro_android_annual": {
        "title": "Pro Annual",
        "description": "Pro plan, billed annually. Higher vehicle limit and Pro features.",
        "base_plan_id": "annual",
        "billing_period": "P1Y",
        "price": "29.99",
    },
    "premium_android_month": {
        "title": "Premium Monthly",
        "description": "Premium plan, billed monthly. Highest vehicle limit and all Premium features.",
        "base_plan_id": "monthly",
        "billing_period": "P1M",
        "price": "6.99",
    },
    "premium_android_annual": {
        "title": "Premium Annual",
        "description": "Premium plan, billed annually. Highest vehicle limit and all Premium features.",
        "base_plan_id": "annual",
        "billing_period": "P1Y",
        "price": "69.99",
    },
}


def get_token():
    global SA_ACCOUNT
    if SA_ACCOUNT is None:
        SA_ACCOUNT = resolve_service_account()
    result = subprocess.run(
        [
            "gcloud", "auth", "print-access-token",
            f"--account={SA_ACCOUNT}",
            "--scopes=https://www.googleapis.com/auth/androidpublisher",
        ],
        capture_output=True, text=True, check=True,
    )
    return result.stdout.strip()


class ApiError(Exception):
    def __init__(self, status, body):
        self.status = status
        self.body = body
        super().__init__(f"API error {status}: {body}")


def api_request(method, url, token, body=None):
    # Shell out to curl (see manage-play-iap.py for why: this machine's
    # python.org framework build has an unconfigured CA bundle).
    cmd = [
        "curl", "-s", "-w", "\n%{http_code}",
        "-H", f"Authorization: Bearer {token}",
        "-H", "Content-Type: application/json",
        "-X", method,
    ]
    if body is not None:
        cmd += ["-d", json.dumps(body)]
    cmd.append(url)

    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    *body_lines, status_line = result.stdout.rsplit("\n", 1)
    status = int(status_line)
    response_text = "\n".join(body_lines) if body_lines else (body_lines[0] if body_lines else "")
    if response_text.strip():
        try:
            parsed = json.loads(response_text)
        except json.JSONDecodeError:
            # A non-JSON body (e.g. a 404 with no body, or an HTML/plain-text
            # error page) shouldn't crash the script before the caller gets
            # a chance to check `status` -- surface the raw text instead.
            parsed = {"raw": response_text}
    else:
        parsed = {}

    if status >= 400:
        raise ApiError(status, parsed)
    return parsed


def cmd_status(args):
    token = get_token()
    product_ids = [args.product_id] if args.product_id else list(CATALOG.keys())
    for product_id in product_ids:
        try:
            product = api_request("GET", f"{API_BASE}/subscriptions/{product_id}", token)
        except ApiError as e:
            if e.status == 404:
                print(f"'{product_id}': does not exist yet.")
                continue
            raise
        base_plans = product.get("basePlans", [])
        print(f"'{product_id}': listings={[l.get('title') for l in product.get('listings', [])]}")
        for bp in base_plans:
            regional = bp.get("regionalConfigs", [])
            us = next((r for r in regional if r.get("regionCode") == "US"), None)
            price = None
            if us and "price" in us:
                m = us["price"]
                price = f"{m.get('currencyCode')} {m.get('units', '0')}.{str(m.get('nanos', 0))[:2].zfill(2)}"
            print(f"    basePlan={bp['basePlanId']} state={bp.get('state')} US price={price}")


def get_regions_version(token, base_price):
    resp = api_request(
        "POST", f"{API_BASE}/pricing:convertRegionPrices", token,
        body={"price": {"currencyCode": "USD", "units": base_price.split(".")[0],
                         "nanos": int(base_price.split(".")[1].ljust(9, "0"))}},
    )
    return resp["regionVersion"]["version"], resp["convertedRegionPrices"]


def cmd_create_draft(args):
    token = get_token()
    for product_id, spec in CATALOG.items():
        try:
            api_request("GET", f"{API_BASE}/subscriptions/{product_id}", token)
            print(f"'{product_id}' already exists -- skipping")
            continue
        except ApiError as e:
            if e.status != 404:
                raise

        print(f"Creating '{product_id}'...")
        regions_version, converted = get_regions_version(token, spec["price"])
        us_price = converted.get("US", {}).get("price") or converted.get("us", {}).get("price")
        if not us_price:
            print(f"  WARNING: no US region in convertRegionPrices response for {product_id}; skipping")
            continue

        body = {
            "productId": product_id,
            "packageName": PACKAGE_NAME,
            "listings": [{
                "languageCode": "en-US",
                "title": spec["title"],
                "description": spec["description"],
                "benefits": [],
            }],
            "basePlans": [{
                "basePlanId": spec["base_plan_id"],
                "autoRenewingBasePlanType": {"billingPeriodDuration": spec["billing_period"]},
                "regionalConfigs": [{
                    "regionCode": "US",
                    "newSubscriberAvailability": False,  # stays a DRAFT base plan
                    "price": us_price,
                }],
            }],
        }
        query = urllib.parse.urlencode({
            "productId": product_id,
            "regionsVersion.version": regions_version,
        })
        api_request("POST", f"{API_BASE}/subscriptions?{query}", token, body=body)
        print(f"  Created '{product_id}' with DRAFT base plan '{spec['base_plan_id']}' (US price only).")

    print("\nDone. No base plan was activated -- run 'status' to confirm current state.")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    status_parser = sub.add_parser("status")
    status_parser.add_argument("product_id", nargs="?")
    status_parser.set_defaults(func=cmd_status)

    create_parser = sub.add_parser("create-draft")
    create_parser.set_defaults(func=cmd_create_draft)

    args = parser.parse_args()
    try:
        args.func(args)
    except ApiError as e:
        print(f"API error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
