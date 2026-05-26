# Vehicle Vitals User FAQ (Website and iOS)

Last updated: May 19, 2026
Audience: End users (not developers)

This FAQ explains how to perform common actions in Vehicle Vitals on both the website and iOS app.

## Website FAQ

### 1) How do I create an account on the website?

Go to the Login or Sign Up page from the top-right header action.
On Sign Up, enter your email, password, and confirmation password.
Submit the form and complete any required verification prompts.
After successful signup, you are routed to the secure app area.

### 2) How do I sign in to my account?

Open the Login page from the header.
Enter your email and password, then select Sign In.
If credentials are valid, you are redirected to your Garage.

### 3) How do I reset my password?

From Login, choose Forgot Password.
Enter your account email and submit.
Use the password reset email link, then return to Login with your new password.

### 4) How do I add my first vehicle?

Go to Garage and select Add Vehicle.
Enter VIN (17 characters) and run decode, or fill Year/Make/Model manually if needed.
Add mileage and save.
The vehicle appears in Garage and is available to Records, Upcoming, and Timeline features.

### 5) How does VIN Decode help me?

VIN decode can auto-populate vehicle details (for example make/model/year and additional profile data where available).
After decoding, review fields for accuracy and save.
If decode is unavailable, enter details manually and continue.

### 6) Can I edit a vehicle after adding it?

Yes.
Open the vehicle in Garage and choose Edit Vehicle.
Update fields such as mileage, nickname, or vehicle metadata, then save.

### 7) How do I remove a vehicle?

In Garage, open the vehicle card and choose Delete when available.
Confirm the prompt.
Use deletion carefully because it can remove related context used by reminders and history views.

### 8) What is the Garage page used for?

Garage is the central list of all vehicles.
You can search by year, make, model, or VIN.
You can select a vehicle to review status, maintenance signals, and quick links to related workflows.

### 9) What is “Upcoming Maintenance” on vehicle cards?

It shows near-term service items calculated from known schedules and mileage.
Urgency indicators help prioritize what needs action first.
Use View all to open the full Upcoming Tasks page.

### 10) How do I log maintenance records?

Open a vehicle and go to Records.
Add maintenance entries with date, mileage, notes, and cost details.
Save to persist entries.
Records become part of timeline and reporting workflows.

### 11) Can I upload documents (receipts, invoices, PDFs)?

Yes, in Records.
Upload files for the relevant record item.
If upload fails, retry from the same records workflow.
You can also open or remove attachments from the record view.

### 12) How do reminders work from Records?

Records can create reminder entries tied to service type and due context.
Saved reminders appear in Upcoming Tasks.
You can complete, snooze, dismiss, or reopen reminders from task management views.

### 13) How do I use Upcoming Tasks?

Open Upcoming from navigation.
Review tasks sorted by urgency.
For each task, save reminder state and choose action:
Complete, Snooze, Dismiss, or Reopen where supported.

### 14) Can I add maintenance tasks to my calendar from the website?

Yes.
In reminder or insight-supported flows, choose the calendar action.
The app creates a calendar event using configured calendar integration behavior.

### 15) What does Timeline Dashboard show?

Timeline gives chronological service and ownership history.
Use it to verify completed work, ordering of events, and long-term lifecycle trends.

### 16) How do I find nearby service providers?

Open Service Providers.
Enter location context and search criteria.
Use filtering options where available to narrow provider type and results.

### 17) How do profile preferences affect reminders?

Profile settings include reminder lead-time and usage assumptions (for example average driving patterns).
These values influence when reminder windows appear.
Save profile preferences to apply changes.

### 18) Can I store location and provider preferences?

Yes.
Profile supports location fields and provider search preferences.
These settings are used by nearby provider lookup and recommendation behavior.

### 19) What is the Subscription/Plans page for?

Plans and Billing explains available tiers and limits.
Use it to evaluate upgrades and current entitlement behavior.

### 20) How do I export maintenance history on the website?

Open a vehicle in Edit Vehicle.
Use export actions for CSV or PDF where your current tier allows access.
If a format is locked, upgrade prompts can appear to explain required plan level.

### 21) Why can’t I access some app routes in production web?

Production web may operate in marketing-focused mode depending on environment policy.
If app routes are restricted, use permitted marketing/help/contact flows for that environment.

### 22) How do I contact support from the website?

Open Contact from footer or support links in help pages.
Provide issue summary, environment, and steps to reproduce.
Include relevant VIN/context when asking about record-specific issues.

### 23) How do I use Help and Getting Started pages?

Use Getting Started for onboarding sequence and first-run actions after you are logged in.
Use Help for common troubleshooting and task-based guidance from the footer Help link.
Video walkthrough lanes are included where media is available.

### 24) Why do I sometimes see poster images instead of videos?

If a demo clip is missing or cannot load, the page falls back to poster preview automatically.
This is expected behavior and prevents page breakage.

### 25) Is there a demonstration data loader in all environments?

No.
Environment-specific controls may be shown only in designated demonstration contexts.
If you do not see demo seed controls, that is expected in non-demo environments.

### 26) Is VIN data enrichment automatic?

Yes, where applicable the system can perform VIN insight synchronization automatically and continue retries when recoverable failures occur.
You should not need a manual backfill action for normal use.

## iOS App FAQ

### 1) How do I start using the iOS app?

Install and open the app.
You land on marketing or auth entry depending on state.
Sign up or log in to access /app routes.

### 2) How do I sign up on iOS?

Open Sign Up from auth flow.
Enter email and password details.
Submit and continue to the app once account creation succeeds.

### 3) How do I sign in on iOS?

Open Login.
Enter email and password, then Sign In.
Successful sign-in routes you to Garage (Home).

### 4) How do I reset my password on iOS?

From Login, open Forgot Password.
Submit your email and follow reset instructions.
Return to Login and sign in with your updated password.

### 5) How do I add a vehicle on iOS?

From Garage, tap Add Vehicle.
Enter VIN and decode, or fill fields manually.
Provide mileage and save.
If plan limits are reached, app guidance routes to Premium or Contact flows.

### 6) Can I scan a VIN on iOS?

Yes.
Use the Scan VIN route and confirm captured VIN.
Continue to add/edit flow to decode and save.

### 7) What happens if VIN decode fails on iOS?

The app shows an error and you can retry.
You can still enter Year/Make/Model manually and save.

### 8) How do I edit an existing vehicle on iOS?

Open the vehicle from Garage.
Choose Edit Vehicle.
Update details and save.

### 9) How do I view and manage maintenance records on iOS?

Open vehicle Records.
Edit record categories/items, upload attachments, and save changes.
Use retry actions for failed uploads.

### 10) Can I open and delete uploaded record files on iOS?

Yes.
Record attachments support open and delete operations in Records.

### 11) How do I use Upcoming Tasks on iOS?

Open Upcoming from app navigation.
Review tasks sorted by urgency.
Save reminders and use actions like complete/snooze/dismiss/reopen where shown.

### 12) How do I add a maintenance event to calendar on iOS?

In Upcoming or related maintenance flows, choose Add to Calendar.
The app creates an event via calendar integration service and confirms success/failure.

### 13) What does Timeline Dashboard do on iOS?

Timeline shows maintenance events in chronological order.
Use it to trace ownership and service history over time.

### 14) Where do I configure reminder and calendar preferences on iOS?

Open account-related settings screens:
Reminder Preferences, Calendar Preferences, and Email Preferences.
Adjust values and save.

### 15) How do notifications work on iOS?

Allow notification permissions when prompted.
Foreground reminders and notification routing are handled by app notification services.
If disabled at OS level, enable them in iOS Settings.

### 16) How do I view account details and sign out on iOS?

Open Profile/Account screen from app menu.
Use Sign Out action when needed.

### 17) How do I find service providers on iOS?

Open Service Providers from app routes.
Search using available location and provider options.

### 18) What is the Premium screen for on iOS?

Premium explains plan benefits and entitlement paths.
If your current plan limits vehicle count, app guidance may route you here.

### 19) How do I export maintenance data on iOS?

Open a vehicle's Maintenance list.
Use the export menu and select CSV, PDF, or Excel based on plan availability.
If a premium format is restricted, upgrade paths are shown.

### 20) What is Offline Settings on iOS?

Offline settings control local behavior for disconnected usage patterns.
Adjust according to your reliability and storage preferences.

### 21) What is Analytics screen on iOS?

Analytics shows ownership and maintenance insights derived from your stored data.
Use it to monitor trends and costs.

### 22) Why does iOS route me away from auth pages after login?

Router guards redirect authenticated users into /app routes and block auth pages when already signed in.
This is expected behavior.

### 23) Why am I redirected to login when opening app routes?

If the current session is unauthenticated, route guards redirect protected /app paths to login.
Sign in and retry.

### 24) Is there parity between web and iOS features?

Core vehicle, records, upcoming, timeline, auth, profile, and provider workflows are available across both platforms.
Some environment-dependent or admin-focused functions may vary by deployment mode.

### 25) How do I contact support from iOS?

Use Contact screen in app routes.
Provide device model, iOS version, and steps that reproduce the issue.

### 26) What should I include when reporting a bug?

Include platform (web or iOS), timestamp, affected VIN (if safe to share), expected result, actual result, and screenshots if available.
This shortens resolution time significantly.

## Cross-Platform Troubleshooting

### 1) I cannot sign in even with correct password. What should I do?

Confirm email spelling and keyboard auto-correct behavior.
Reset password from Forgot Password.
If issue persists, contact support with timestamp and environment.

### 2) A vehicle does not appear after saving. What should I check?

Verify network connectivity.
Refresh Garage/Home.
Confirm VIN format and required fields.
If still missing, log out/in and re-check.

### 3) Reminder actions appear delayed. Is this normal?

Small propagation delays can occur after save/complete/snooze operations.
Refresh Upcoming view and re-open the task list.

### 4) Calendar event creation failed. What can I try?

Check calendar permissions at OS/browser level.
Retry from task screen.
If repeated failures occur, share error message with support.

### 5) Uploaded record file failed. What can I do?

Retry upload from the same record item.
Check file size/type constraints and network stability.
If necessary, split large files and upload separately.

### 6) Demo videos are not playing. What should I do?

Reload the page/app view.
Check environment connectivity.
If playback still fails, poster fallback is expected and core app functionality is unaffected.

## Quick Navigation Reference

### Website route quick list

- `/` marketing landing
- `/auth/login` login
- `/auth/signup` signup
- `/auth/forgot-password` password reset
- `/app` garage
- `/app/add-vehicle` add vehicle
- `/app/edit-vehicle/:vin` edit vehicle
- `/app/records/:vin` records
- `/app/upcoming` upcoming tasks
- `/app/timeline` timeline dashboard
- `/app/profile` profile
- `/app/providers` service providers
- `/app/subscription` plans and billing
- `/help` help
- `/getting-started` onboarding instructions

### iOS route quick list

- `/marketing`
- `/auth/login`
- `/auth/signup`
- `/auth/forgot-password`
- `/app`
- `/app/add-vehicle`
- `/app/scan-vin`
- `/app/records/:vin`
- `/app/upcoming`
- `/app/timeline`
- `/app/profile`
- `/app/service-providers`
- `/app/premium`
- `/app/calendar-preferences`
- `/app/reminder-preferences`
- `/app/email-preferences`
- `/app/offline-settings`
- `/app/analytics`

---

If you want this FAQ published directly into the web Help page and mirrored in an in-app iOS help screen, that can be added as the next step.
