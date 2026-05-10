# Vehicle Vitals — User Guide

> **Your complete reference for managing vehicle maintenance, tracking costs, and staying ahead of service schedules.**

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Signing In & Creating an Account](#2-signing-in--creating-an-account)
3. [Your Garage](#3-your-garage)
4. [Adding a Vehicle](#4-adding-a-vehicle)
5. [Editing a Vehicle](#5-editing-a-vehicle)
6. [Vehicle Records](#6-vehicle-records)
7. [Maintenance Timeline](#7-maintenance-timeline)
8. [Upcoming Tasks & Reminders](#8-upcoming-tasks--reminders)
9. [Service Providers](#9-service-providers)
10. [Your Profile & Settings](#10-your-profile--settings)
11. [Frequently Asked Questions](#11-frequently-asked-questions)

---

## 1. Getting Started

Vehicle Vitals is a secure, cloud-based vehicle management platform. With it you can:

- **Track your entire fleet** — cars, trucks, SUVs — in one place
- **Log and analyze maintenance costs** across all vehicles
- **See your full maintenance timeline** in reverse chronological order
- **Receive proactive reminders** before service is due
- **Store and organize vehicle records** — service histories, repair invoices, ownership docs, and more
- **Find nearby repair shops and dealerships** based on your location and vehicle make

### Supported Platforms

Vehicle Vitals is available on the web and on iOS at launch. You can use either interface or both, and the core functionality is the same across them.

The web app works in any modern browser (Chrome, Safari, Edge, Firefox). The iOS app gives you the same full experience on your phone.

### Navigation

The navigation bar at the top of every page provides quick access to all sections:

| Section       | What You'll Find                            |
| ------------- | ------------------------------------------- |
| **Garage**    | Your vehicle list and cost summaries        |
| **Timeline**  | All maintenance events across every vehicle |
| **Upcoming**  | Service reminders and alerts                |
| **Providers** | Local repair shops and dealerships          |
| **Profile**   | Account settings, alerts, and address       |

---

## 2. Signing In & Creating an Account

### Landing Page

When you first visit Vehicle Vitals, you'll see the landing page with an overview of features.

![Landing page hero with feature highlights](./screenshots/landing.png)

Click **Get Started** or **Sign In** in the header to proceed to the sign-in page.

### Sign In

![Sign-in page](./screenshots/login.png)

1. Enter your **email address**
2. Enter your **password**
3. Click **Sign In**

You can also sign in with **Google** or **Apple** using the social login buttons.

> **Forgot your password?** Click "Reset it" below the sign-in form. Enter your email and you'll receive a reset link.

### Create an Account

![Sign-up page](./screenshots/signup.png)

1. Click **Sign up** on the login page
2. Enter your **email address** and choose a **password**
3. Click **Create Account**

Once your account is created, you'll land directly in your Garage.

### iOS Mobile App Views

The following iOS screenshots show the mobile experience for key flows.

![iOS marketing welcome screen](./screenshots/ios-marketing.png)

![iOS sign-in screen](./screenshots/ios-login.png)

![iOS garage home screen](./screenshots/ios-home.png)

![iOS upcoming tasks screen](./screenshots/ios-upcoming.png)

![iOS profile and settings screen](./screenshots/ios-profile.png)

---

## 3. Your Garage

The Garage is your home base — a list of all your vehicles with at-a-glance cost and record status.

![Garage with 3 vehicles loaded](./screenshots/garage-vehicles.png)

### Vehicle Cards

Each vehicle card displays:

- **Year, Make, Model, and Trim** (e.g., 2022 Ford F-150 Lariat)
- **VIN** and current **odometer** reading
- **Records completion status** (e.g., Records: 7/7)

Click any vehicle card to expand the **detail panel** on the right.

### Vehicle Detail Panel

![Vehicle detail panel showing cost of ownership data](./screenshots/garage-detail.png)

The detail panel shows:

- **Cost of Ownership** — Total spend, monthly average, and service spend
- **Cost Breakdown** — Category chart (Service, Parts, etc.)
- **Service Categories** — Itemized by type (Oil Change, Battery, Transmission, etc.)
- Action buttons: **Edit Vehicle**, **View Records**, **Delete Vehicle**

### Search

Use the search box above the vehicle list to quickly find a vehicle by year, make, model, or VIN.

### Adding Your First Vehicle

If your garage is empty, click **Add your first vehicle** or the **Add Vehicle** button in the header area.

---

## 4. Adding a Vehicle

Click **Add Vehicle** from the Garage to open the vehicle setup form.

![Add vehicle form with year/make/model dropdowns](./screenshots/add-vehicle.png)

### Vehicle Setup Form

Fill in the following fields:

| Field             | Description                                |
| ----------------- | ------------------------------------------ |
| **Year**          | Model year of the vehicle                  |
| **Make**          | Manufacturer (Ford, Toyota, BMW, etc.)     |
| **Model**         | Specific model and trim                    |
| **VIN**           | 17-character Vehicle Identification Number |
| **License Plate** | State plate number                         |
| **Odometer**      | Current mileage reading                    |

### VIN Decode

After entering a valid VIN, click **Decode VIN** to automatically backfill the year, make, and model from NHTSA data. This saves time and ensures accuracy.

### Saving the Vehicle

Once all required fields are complete, click **Save Vehicle**. The vehicle will appear in your Garage immediately.

---

## 5. Editing a Vehicle

From the Garage, select a vehicle and click **Edit Vehicle** in the detail panel.

![Edit vehicle form showing current values for F-150 Lariat](./screenshots/edit-vehicle.png)

The edit form shows current values pre-filled. You can update:

- **Year, Make, Model, Trim**
- **License Plate**
- **Odometer** (update after service visits)
- **VIN** (rare, but editable)

Click **Save Changes** when done, or **Back** to cancel.

---

## 6. Vehicle Records

Every vehicle has a Records portfolio with 7 required document categories.

![Vehicle records page showing ownership insights and document status](./screenshots/records.png)

### Accessing Records

From the Garage detail panel, click **View Records**.

### Required Record Types

Vehicle Vitals tracks **7 required record categories** per vehicle:

| Category            | What to Upload                      |
| ------------------- | ----------------------------------- |
| **Bill of Sale**    | Purchase contract or title transfer |
| **Loan or Lease**   | Financing or lease agreement        |
| **Payment History** | Statements showing payment history  |
| **Service History** | Dealer and shop service records     |
| **Repair Invoices** | Invoices for all repairs and parts  |
| **Insurance**       | Current insurance declarations      |
| **Registration**    | Current registration document       |

A **"7/7 complete"** badge means all required records are filed. Incomplete categories show which documents are still needed.

### Ownership Insights

At the top of the Records page, the **Ownership Insights** panel extracts financial data from your documents:

- **Maintenance spend** — Total dollars tracked, number of docs, latest service date
- **Estimated monthly payment** — Calculated from finance documents
- **Document intelligence** — Shows how many documents have been analyzed

---

## 7. Maintenance Timeline

The Timeline gives you a bird's-eye view of all service events across your entire garage, in reverse chronological order.

![Maintenance timeline showing all 3 vehicles' service history](./screenshots/timeline.png)

### Timeline Summary Panel

The **Timeline Summary** at the top shows:

- **Time Range** filter — All, Past, or Future events
- **Vehicle filter** — Show all vehicles or select specific ones
- **Entry count** and **latest activity date**
- **Document intelligence** summary

### Timeline Events

Each event card shows:

- **Service name** (e.g., "Battery Replacement", "Transmission Fluid Service")
- **Vehicle name, VIN, and plate**
- **Cost** and **date**
- **Notes** from the service record

### Filtering the Timeline

Use the **Time Range** buttons to narrow your view:

- **All** — Show every recorded and future event
- **Past** — Only completed service records
- **Future** — Scheduled and upcoming services

Use the **vehicle filter** buttons to focus on one or more specific vehicles.

---

## 8. Upcoming Tasks & Reminders

The Upcoming Tasks page helps you stay ahead of scheduled maintenance.

![Upcoming tasks page showing reminder center with active alerts](./screenshots/upcoming.png)

### Reminder Center

The **Reminder Center** panel at the top shows your current alert settings:

- **Alerts** — Enabled or Disabled
- **Lead time** — How many days in advance to alert (default: 14 days)
- **Average driving** — Estimated miles per day (used to predict upcoming mileage)
- **Alert window** — Miles ahead to scan for upcoming service (e.g., 490 miles)
- **Reminder Email** — Address to receive email notifications

### Task Tabs

Filter tasks using the tab bar:

| Tab           | Description                         |
| ------------- | ----------------------------------- |
| **All**       | All reminders regardless of status  |
| **Active**    | Alerts currently due or approaching |
| **Snoozed**   | Alerts deferred to a future date    |
| **Completed** | Reminders you've marked done        |
| **Dismissed** | Alerts you've permanently dismissed |

### Task Actions

For each active reminder, you can:

- **Send Email Now** — Immediately send yourself a reminder email
- **Snooze 2 Weeks** — Defer the reminder for 14 days
- **Complete** — Mark the task as done
- **Dismiss** — Permanently remove the reminder

### Managing Alert Settings

Scroll down on the Upcoming page to adjust your reminder preferences, or go to **Profile → Maintenance Alert Preferences**.

---

## 9. Service Providers

Find local repair shops and dealerships near your home address.

![Service providers search page with location preferences](./screenshots/providers.png)

### Search Preferences

Before running a search, configure your preferences:

| Setting                 | Description                                 |
| ----------------------- | ------------------------------------------- |
| **Street, City, State** | Your home or preferred search location      |
| **Radius**              | Search radius in miles (default: 25 miles)  |
| **Provider Type**       | All, Repair shops only, or Dealerships only |
| **Vehicle Make**        | Filter dealerships by your vehicle's make   |

Check **"Prioritize my saved vehicle make"** to rank dealerships matching your vehicles higher in results.

### Running a Search

Click **Find Nearby Providers** to search. Results will appear below, showing provider name, address, phone, and type.

> **Tip:** Save your home address in your Profile so it pre-fills here automatically.

---

## 10. Your Profile & Settings

Access your profile by clicking **Profile** in the navigation bar.

![Profile page showing account overview and settings sections](./screenshots/profile.png)

### Account Overview

The top section shows:

- **Email address** on file
- **User ID** (internal reference)
- **Linked providers** — Add Google or Apple login in addition to email/password
- **Alert status**, **push notification status**, and **reminder lead time**

### Maintenance Alert Preferences

Configure when and how you receive maintenance reminders:

- **Enable/Disable** alerts globally
- **Lead time** — Days before service is due to start alerting
- **Average daily miles** — Used to calculate upcoming mileage milestones

Click **Save Alert Preferences** to persist your changes.

### Home Address

Save your address to enable the **Service Providers** search to pre-populate with your location. Also sets your preferred search radius and provider type filter.

Click **Save Home Address** when done.

### Push Notifications

Click **Enable Push Notifications** to receive reminders when service is due. You can manage notification permissions from your browser on the web or from iOS notification settings on mobile.

### Change Password

Enter your current password and a new password, then confirm it. Click **Update password**.

### Delete Account

Enter your current password to confirm, then click **Delete account**. This permanently removes all your data and cannot be undone.

---

## 11. Frequently Asked Questions

**Q: What is a VIN?**
A: A Vehicle Identification Number (VIN) is a unique 17-character code assigned to every vehicle. It's on your dashboard near the windshield, on your insurance card, or on the driver's door jamb.

**Q: Can I add multiple vehicles?**
A: Yes. There is no limit to the number of vehicles you can add to your Garage.

**Q: What file types can I upload for records?**
A: PDF files are recommended for all record uploads. Each record category can have multiple attachments.

**Q: How does VIN Decode work?**
A: When you enter a VIN and click "Decode VIN," Vehicle Vitals queries the NHTSA (National Highway Traffic Safety Administration) database to retrieve the official make, model, and year.

**Q: How are cost totals calculated?**
A: Costs are extracted from uploaded service invoices and repair records using document intelligence. The more records you upload, the more accurate your cost-of-ownership data becomes.

**Q: Can I share my garage with a family member?**
A: Multi-user sharing is on the product roadmap. Currently, each account is private to the account holder.

**Q: How do I update my mileage?**
A: Edit the vehicle from the Garage detail panel. Update the Odometer field and save. This refreshes mileage-based maintenance predictions.

**Q: Why aren't reminder emails arriving?**
A: Check your spam folder first. If emails still don't arrive, verify your reminder email address in the Upcoming Tasks page and make sure **Alerts: Enabled** is showing in the Reminder Center.

---

_For additional help, visit the [Contact page](../contact) or email support._

_Last updated: May 2026_
