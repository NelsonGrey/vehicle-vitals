#!/usr/bin/env ruby
# frozen_string_literal: true

# Manages App Store Connect auto-renewable subscription products via the
# App Store Connect API (subscriptionGroups / subscriptions resources),
# using the same APP_STORE_CONNECT_KEY_ID/ISSUER_ID/KEY credentials the
# Fastfile already uses for TestFlight uploads and manage_iap.rb uses for
# the (unrelated, one-time-product-shaped) legacy IAP script. Subscriptions
# are a materially different API surface from inAppPurchasesV2 -- there is
# no one-time-product-style flat "create" call; a subscription only becomes
# meaningful once it has a group, a localization, and a price.
#
# Product catalog (must match packages/mobile/lib/services/premium_service.dart
# _iosProductCatalog and packages/functions/src/billing.provider.ts
# IAP_PRODUCT_CATALOG):
#   PRO_iOS_MONTH      pro tier,     monthly, $2.99/mo
#   PRO_iOS_ANNUAL     pro tier,     annual,  $29.99/yr
#   PREMIUM_iOS_MONTH  premium tier, monthly, $6.99/mo
#   PREMIUM_iOS_ANNUAL premium tier, annual,  $69.99/yr
#
# All four are modeled as one subscription group ("Vehicle-Vitals Plans")
# containing four subscriptions, using groupLevel to encode tier rank so
# Apple treats a pro->premium change as an upgrade/downgrade rather than a
# crossgrade, and a monthly<->annual change within the same tier as a
# duration change:
#   groupLevel 1: PRO_iOS_MONTH, PRO_iOS_ANNUAL
#   groupLevel 2: PREMIUM_iOS_MONTH, PREMIUM_iOS_ANNUAL
#
# Usage:
#   ruby manage_subscriptions.rb status                     # read-only
#   ruby manage_subscriptions.rb create_draft                # create group/subscriptions/
#                                                              # localizations/USD price for
#                                                              # any product not already present.
#                                                              # Leaves everything in DRAFT/
#                                                              # MISSING_METADATA state -- does
#                                                              # NOT call subscriptionSubmissions
#                                                              # (that is a deliberate, separate,
#                                                              # human-triggered step; making a
#                                                              # subscription reviewable/
#                                                              # purchasable for real money is out
#                                                              # of scope for this script).
#
# API quirks worth keeping in mind if this is revisited:
#   - There is no direct "set price" call with a raw dollar amount --
#     you must GET /v1/subscriptions/{id}/pricePoints (paginated per
#     territory) to find the subscriptionPricePoint whose customerPrice
#     matches the target, then POST /v1/subscriptionPrices referencing
#     that price point's id. This script only prices the USA territory to
#     keep the draft creation call small and repeatable; a real go-live
#     would want the full multi-territory price list the same way
#     scripts/store-promo/manage-play-iap.py builds one for Android via
#     pricing:convertRegionPrices.
#   - subscriptionAvailability is a separate resource from the
#     subscription itself and must be created explicitly, with an
#     explicit availableTerritories relationship (or
#     availableInNewTerritories: true) -- a subscription with a price but
#     no availability record won't actually be purchasable even once
#     activated.

require "jwt"
require "openssl"
require "net/http"
require "uri"
require "json"
require "base64"
require "dotenv"

repo_root = File.expand_path("../../../../..", __dir__)
Dotenv.load(File.join(repo_root, ".env.development")) if File.exist?(File.join(repo_root, ".env.development"))

BUNDLE_ID = "com.vehiclevitals.app.ios"
GROUP_REFERENCE_NAME = "Vehicle-Vitals Plans"
GROUP_LOCALIZED_NAME = "Vehicle-Vitals Plans"

PRODUCT_CATALOG = {
  "PRO_iOS_MONTH" => { name: "Pro Monthly", period: "ONE_MONTH", group_level: 1, price: "2.99",
                        description: "Pro plan, billed monthly. Higher vehicle limit and Pro features." },
  "PRO_iOS_ANNUAL" => { name: "Pro Annual", period: "ONE_YEAR", group_level: 1, price: "29.99",
                         description: "Pro plan, billed annually. Higher vehicle limit and Pro features." },
  "PREMIUM_iOS_MONTH" => { name: "Premium Monthly", period: "ONE_MONTH", group_level: 2, price: "6.99",
                            description: "Premium plan, billed monthly. Highest vehicle limit and all Premium features." },
  "PREMIUM_iOS_ANNUAL" => { name: "Premium Annual", period: "ONE_YEAR", group_level: 2, price: "69.99",
                             description: "Premium plan, billed annually. Highest vehicle limit and all Premium features." }
}.freeze

PRIVATE_KEY_BEGIN_MARKER = ["-----BEGIN", "PRIVATE", "KEY-----"].join(" ")
EC_PRIVATE_KEY_BEGIN_MARKER = ["-----BEGIN", "EC", "PRIVATE", "KEY-----"].join(" ")

def normalized_private_key_content
  raw = ENV["APP_STORE_CONNECT_KEY"].to_s
  raise "Missing APP_STORE_CONNECT_KEY" if raw.strip.empty?

  cleaned = raw.gsub("\0", "").gsub(/\x00/, "").gsub("%", "").strip
  key_content = cleaned
  unless key_content.include?("-----BEGIN")
    decoded = Base64.decode64(key_content.gsub(/\s+/, ""))
    key_content = decoded if decoded.include?("-----BEGIN")
  end

  key_content = key_content.gsub(/\A['"]|['"]\z/, "")
  key_content = key_content.gsub(/\\n/, "\n").gsub(/\r\n?/, "\n")
  key_content = key_content.lines.map(&:strip).reject(&:empty?).join("\n") + "\n"

  unless key_content.include?(PRIVATE_KEY_BEGIN_MARKER) || key_content.include?(EC_PRIVATE_KEY_BEGIN_MARKER)
    raise "APP_STORE_CONNECT_KEY could not be normalized to a valid .p8 key"
  end

  key_content
end

def mint_jwt
  key_id = ENV["APP_STORE_CONNECT_KEY_ID"].to_s.strip
  issuer_id = ENV["APP_STORE_CONNECT_ISSUER_ID"].to_s.strip
  raise "Missing APP_STORE_CONNECT_KEY_ID" if key_id.empty?
  raise "Missing APP_STORE_CONNECT_ISSUER_ID" if issuer_id.empty?

  private_key = OpenSSL::PKey.read(normalized_private_key_content)
  now = Time.now.to_i

  JWT.encode(
    { iss: issuer_id, iat: now, exp: now + (19 * 60), aud: "appstoreconnect-v1" },
    private_key,
    "ES256",
    { kid: key_id, typ: "JWT" }
  )
end

def asc_request(method, path, body: nil)
  uri = URI("https://api.appstoreconnect.apple.com#{path}")
  req_class = { get: Net::HTTP::Get, post: Net::HTTP::Post, patch: Net::HTTP::Patch }.fetch(method)
  req = req_class.new(uri)
  req["Authorization"] = "Bearer #{mint_jwt}"
  req["Content-Type"] = "application/json"
  req.body = JSON.generate(body) if body
  res = Net::HTTP.start(uri.host, uri.port, use_ssl: true) { |http| http.request(req) }
  parsed = res.body.to_s.empty? ? {} : (JSON.parse(res.body) rescue { "raw" => res.body })
  raise "ASC API #{method.upcase} #{path} failed (#{res.code}): #{parsed}" unless res.code.to_i.between?(200, 299)

  parsed
end

def asc_get(path) = asc_request(:get, path)
def asc_post(path, body) = asc_request(:post, path, body: body)

def app_id
  result = asc_get("/v1/apps?filter[bundleId]=#{BUNDLE_ID}")
  app = result["data"]&.first
  raise "No app found for bundle id #{BUNDLE_ID}" unless app

  app["id"]
end

def find_or_create_group(app_id)
  groups = asc_get("/v1/apps/#{app_id}/subscriptionGroups?limit=50")
  existing = groups["data"]&.find { |g| g.dig("attributes", "referenceName") == GROUP_REFERENCE_NAME }
  return existing["id"] if existing

  puts "Creating subscription group '#{GROUP_REFERENCE_NAME}'..."
  created = asc_post("/v1/subscriptionGroups", {
    data: {
      type: "subscriptionGroups",
      attributes: { referenceName: GROUP_REFERENCE_NAME },
      relationships: { app: { data: { type: "apps", id: app_id } } }
    }
  })
  group_id = created["data"]["id"]

  puts "Creating en-US localization for the group..."
  asc_post("/v1/subscriptionGroupLocalizations", {
    data: {
      type: "subscriptionGroupLocalizations",
      attributes: { name: GROUP_LOCALIZED_NAME, locale: "en-US" },
      relationships: { subscriptionGroup: { data: { type: "subscriptionGroups", id: group_id } } }
    }
  })

  group_id
end

def find_subscription(group_id, product_id)
  subs = asc_get("/v1/subscriptionGroups/#{group_id}/subscriptions?limit=50")
  subs["data"]&.find { |s| s.dig("attributes", "productId") == product_id }
end

# Product IDs are unique per app across ALL subscription groups, not just
# the one this script would create -- so "does this product already exist"
# has to check app-wide, not just inside GROUP_REFERENCE_NAME. This matters
# in practice: this app's four products already exist, created earlier
# under a differently-named group ("Vehicle-Vitals iOS Digital
# Subscription"), so scoping the lookup to GROUP_REFERENCE_NAME alone would
# have missed them and attempted a duplicate create (which the API would
# have rejected, but only after already creating a second, confusing,
# empty group).
def find_subscription_in_any_group(app_id, product_id)
  groups = asc_get("/v1/apps/#{app_id}/subscriptionGroups?limit=50")
  groups["data"]&.each do |g|
    subs = asc_get("/v1/subscriptionGroups/#{g['id']}/subscriptions?limit=50")
    match = subs["data"]&.find { |s| s.dig("attributes", "productId") == product_id }
    return [g, match] if match
  end
  [nil, nil]
end

def create_subscription(group_id, product_id, spec)
  puts "Creating subscription '#{product_id}'..."
  created = asc_post("/v1/subscriptions", {
    data: {
      type: "subscriptions",
      attributes: {
        name: spec[:name],
        productId: product_id,
        subscriptionPeriod: spec[:period],
        groupLevel: spec[:group_level],
        familySharable: false
      },
      relationships: { group: { data: { type: "subscriptionGroups", id: group_id } } }
    }
  })
  sub_id = created["data"]["id"]

  puts "  Creating en-US localization..."
  asc_post("/v1/subscriptionLocalizations", {
    data: {
      type: "subscriptionLocalizations",
      attributes: { name: spec[:name], locale: "en-US", description: spec[:description] },
      relationships: { subscription: { data: { type: "subscriptions", id: sub_id } } }
    }
  })

  puts "  Pricing (USA, $#{spec[:price]})..."
  price_points = asc_get(
    "/v1/subscriptions/#{sub_id}/pricePoints?filter[territory]=USA" \
    "&fields[subscriptionPricePoints]=customerPrice,territory&limit=8000&include=territory"
  )
  match = price_points["data"]&.find { |pp| pp.dig("attributes", "customerPrice") == spec[:price] }
  if match
    asc_post("/v1/subscriptionPrices", {
      data: {
        type: "subscriptionPrices",
        relationships: {
          subscription: { data: { type: "subscriptions", id: sub_id } },
          subscriptionPricePoint: { data: { type: "subscriptionPricePoints", id: match["id"] } }
        }
      }
    })
  else
    puts "  ⚠️  No USA price point found matching $#{spec[:price]} -- skipping price, product stays MISSING_METADATA"
  end

  puts "  Setting USA availability..."
  begin
    territories = asc_get("/v1/territories?filter[id]=USA")
    territory_id = territories["data"]&.first&.dig("id") || "USA"
    asc_post("/v1/subscriptionAvailabilities", {
      data: {
        type: "subscriptionAvailabilities",
        attributes: { availableInNewTerritories: false },
        relationships: {
          subscription: { data: { type: "subscriptions", id: sub_id } },
          availableTerritories: { data: [{ type: "territories", id: territory_id }] }
        }
      }
    })
  rescue => e
    puts "  ⚠️  Could not set availability: #{e.message}"
  end

  sub_id
end

def print_status
  id = app_id
  puts "App Store Connect app id: #{id}"

  versions = asc_get("/v1/apps/#{id}/appStoreVersions?limit=5")
  puts "\nRecent App Store versions:"
  versions["data"].each do |v|
    attrs = v["attributes"]
    puts "  - #{attrs['versionString']}: appStoreState=#{attrs['appStoreState']} (created #{attrs['createdDate']})"
  end

  groups = asc_get("/v1/apps/#{id}/subscriptionGroups?limit=50")
  if groups["data"].empty?
    puts "\nNo subscription groups exist yet."
    return
  end

  groups["data"].each do |g|
    puts "\nSubscription group: #{g.dig('attributes', 'referenceName')} (#{g['id']})"
    subs = asc_get("/v1/subscriptionGroups/#{g['id']}/subscriptions?limit=50")
    if subs["data"].empty?
      puts "  (no subscriptions)"
    else
      subs["data"].each do |s|
        attrs = s["attributes"]
        puts "  - #{attrs['productId']}: name=#{attrs['name']} period=#{attrs['subscriptionPeriod']} " \
             "groupLevel=#{attrs['groupLevel']} state=#{attrs['state']}"
      end
    end
  end
end

def create_draft
  id = app_id
  group_id = nil

  PRODUCT_CATALOG.each do |product_id, spec|
    existing_group, existing_sub = find_subscription_in_any_group(id, product_id)
    if existing_sub
      puts "'#{product_id}' already exists in group '#{existing_group.dig('attributes', 'referenceName')}' " \
           "(id=#{existing_sub['id']}, state=#{existing_sub.dig('attributes', 'state')}) -- skipping"
      next
    end

    group_id ||= find_or_create_group(id)
    create_subscription(group_id, product_id, spec)
  end

  puts "\nDone. Nothing was submitted for review and no product is active/purchasable --"
  puts "run 'status' to confirm current state."
end

command = ARGV[0]
case command
when "status"
  print_status
when "create_draft"
  create_draft
else
  puts "Usage: ruby manage_subscriptions.rb [status|create_draft]"
  exit 1
end
