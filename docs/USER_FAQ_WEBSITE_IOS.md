# Vehicle Vitals User FAQ: Web and iOS

Last reviewed: July 20, 2026

This FAQ describes the implemented web and iOS application flows. The web app
is live at `https://vehicle-vitals.com`. Confirm the current App Store or
TestFlight availability before telling users that the iOS build is publicly
downloadable.

## Accounts and Sign-In

### How do I create an account or sign in?

On the web, use Sign Up or Sign In from the header. On iOS, start from the
welcome screen and choose the corresponding action. Email/password and the
providers shown by the current client are available; the exact providers may
vary by platform and Firebase configuration.

### What if I forget my password?

Choose Forgot Password, enter the account email, and follow the reset email.
Check spam or junk mail if the message does not arrive.

### Why does the app return me to Garage after sign-in?

Garage is the default authenticated destination. A valid deep link or selected
plan may override that default.

### Why do web and iOS show different vehicles?

First confirm both clients are signed into the same Firebase identity. If the
same person accidentally created two accounts, open Account and use the
Account Consolidation workflow where it is offered. Review the source and
destination carefully before confirming a merge.

## Garage and Vehicle Records

### How do I add a vehicle?

Open Garage and choose Add Vehicle. Enter a 17-character VIN for lookup or use
the available manual fields. Review all decoded values before saving; a VIN
lookup can be incomplete or unavailable.

On iOS, the Scan VIN action can capture a VIN with the camera. Confirm the
recognized value before continuing.

### How do I edit or remove a vehicle?

Open the vehicle and choose the available edit or delete action. Deleting a
vehicle can affect its records, reminders, history, and attachments; read the
confirmation before proceeding.

### What can I store in Records?

Records organize maintenance and ownership information such as service work,
costs, dates, mileage, notes, invoices, receipts, and supported attachments.
File availability and export formats can depend on platform and entitlement.

## Maintenance Plan and Service History

### What is Maintenance Plan?

Maintenance Plan—shown as Plan in compact mobile navigation—combines available
maintenance recommendations with saved reminders. You can create reminders and,
where shown, complete, snooze, dismiss, or reopen them.

Recommendations and vehicle-health indicators are informational. Confirm
maintenance requirements with the owner's manual, manufacturer guidance, or a
qualified professional.

### What is Service History?

Service History—shown as History in compact mobile navigation—presents saved
service and ownership activity chronologically across the garage. Add or edit
the underlying vehicle records to correct the history.

### How do calendar and email reminders work?

Open Account and the relevant reminder, email, or calendar preferences. The
available calendar target and permission flow differ between web and iOS. A
successful preference save is not proof that a third-party calendar or email
provider delivered an event or message, so verify the destination when it
matters.

## Shops, Account, and Privacy

### How do I find a service provider?

Open Shops & Services. Enter or permit a location and select the available
search filters. Results come from external provider data and should be verified
before travel or service decisions.

### Where are settings?

Open Account—Account is the compact mobile and current web capability label.
It contains profile, security, reminder, subscription, data/privacy, support,
and related settings exposed for that platform.

### How do I request an export or account deletion?

Open Account, then Data & Privacy. Use Request Data Export or Delete Account
when shown and follow the confirmation flow. If the action fails or is not
available on the client version, use Support. Account deletion is a
high-impact action and may require recent authentication.

### What does offline mode do on iOS?

Offline Settings controls local availability and queued synchronization. Data
already synchronized to the account remains online when the local cache is
cleared. Confirm the device has reconnected and synchronization has completed
before relying on a recent offline change elsewhere.

## Plans, Ads, and Availability

### Why is a feature or export unavailable?

Some capabilities are controlled by the account entitlement, quota, platform,
runtime feature flags, or the `app_offline` maintenance switch. The upgrade or
unavailable message shown in the client is the current guidance; planned
features in strategy documents are not guaranteed shipped features.

### Why do I see ads?

Ad display depends on environment, consent, placement configuration, and the
account's ad-free entitlement. Change optional consent through the available
privacy controls. Do not promise a paid or ad-free outcome unless the current
checkout and entitlement path has been verified.

## Troubleshooting and Support

Try these steps before contacting Support:

1. Confirm network access and the correct signed-in account.
2. Refresh the web page or fully restart the iOS app.
3. Check that camera, notifications, calendar, or location permission is
   enabled when the action needs it.
4. Retry once and capture the exact error without including credentials or
   private documents.

Use the in-product Support page. Include the platform and version, approximate
time, steps to reproduce, expected result, actual result, and a redacted
screenshot when useful. Never send passwords, service-account keys, payment
details, or unredacted sensitive documents.
