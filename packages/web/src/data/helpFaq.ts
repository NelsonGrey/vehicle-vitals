export type FaqItem = {
  question: string;
  answers: string[];
  /** Retired display terms (e.g. "Timeline", "Mechanic") kept searchable so
   * users who still think in the old vocabulary can find the right answer. */
  legacyTerms?: string[];
};

export const websiteFaq: FaqItem[] = [
  {
    question: 'How do I create an account on the website?',
    answers: [
      'Go to the Login or Sign Up page from the top-right header action.',
      'On Sign Up, enter your email, password, and confirmation password.',
      'Submit the form and complete any required verification prompts.',
      'After successful signup, you are routed to the secure app area.',
    ],
  },
  {
    question: 'How do I sign in to my account?',
    answers: [
      'Open the Login page from the header.',
      'Enter your email and password, then select Sign In.',
      'If credentials are valid, you are redirected to your Garage.',
    ],
  },
  {
    question: 'How do I reset my password?',
    answers: [
      'From Login, choose Forgot Password.',
      'Enter your account email and submit.',
      'Use the password reset email link, then return to Login with your new password.',
    ],
  },
  {
    question: 'How do I add my first vehicle?',
    answers: [
      'Go to Garage and select Add Vehicle.',
      'Choose the vehicle type (for example passenger vehicle, commercial vehicle, motorcycle, RV, boat, trailer, or other).',
      'Enter the vehicle ID and use lookup for faster setup.',
      'If the lookup misses details, fill the remaining Year/Make/Model fields by hand before saving.',
      'Add mileage and save.',
      'The vehicle appears in Garage and is available to Records, Maintenance Plan, and Service History.',
    ],
  },
  {
    question: 'How does vehicle lookup help me?',
    answers: [
      'Vehicle lookup can auto-fill details like make, model, year, and other information when it is available.',
      'For boats, trailers, and other non-VIN assets, skip lookup and enter details manually with your vehicle ID.',
      'After lookup, review the fields for accuracy and save.',
      'If lookup is not available or only partly works, keep the vehicle ID entered and finish the missing details by hand.',
    ],
  },
  {
    question: 'Can I edit a vehicle after adding it?',
    answers: [
      'Yes.',
      'Open the vehicle in Garage and choose Edit Vehicle.',
      'Update fields such as mileage, nickname, or vehicle metadata, then save.',
    ],
  },
  {
    question: 'How do I remove a vehicle?',
    answers: [
      'In Garage, open the vehicle card and choose Delete when available.',
      'Confirm the prompt.',
      'Use deletion carefully because it can remove related context used by reminders and history views.',
    ],
  },
  {
    question: 'What is the Garage page used for?',
    answers: [
      'Garage is the central list of all vehicles.',
      'You can search by year, make, model, or VIN.',
      'You can select a vehicle to review status, maintenance signals, and quick links to related workflows.',
    ],
  },
  {
    question: 'What is "Upcoming Maintenance" on vehicle cards?',
    answers: [
      'It shows service items that may be coming due soon based on known schedules and mileage.',
      'The labels help you see what needs attention first.',
      'Use View all to open the full Maintenance Plan.',
    ],
  },
  {
    question: 'How do I log maintenance records?',
    answers: [
      'Open a vehicle and go to Records.',
      'Add maintenance entries with date, mileage, notes, and cost details.',
      'Save to persist entries.',
      'Saved records appear in Service History and supported export workflows.',
    ],
  },
  {
    question: 'Can I upload documents (receipts, invoices, PDFs)?',
    answers: [
      'Yes, in Records.',
      'Upload files for the relevant record item.',
      'If upload fails, retry from the same records workflow.',
      'You can also open or remove attachments from the record view.',
    ],
  },
  {
    question: 'How do reminders work from Records?',
    answers: [
      'Records can create reminder entries tied to service type and due context.',
      'Saved reminders appear in Maintenance Plan.',
      'You can complete, snooze, dismiss, or reopen reminders from task management views.',
    ],
  },
  {
    question: 'How do I use Maintenance Plan?',
    answers: [
      'Open Maintenance Plan from navigation.',
      'Review tasks sorted by urgency.',
      'By default, the list focuses on work estimated to be due inside your saved reminder window. Use Show all recommendations if you want the full list.',
      'For each task, save reminder state and choose an action such as Send Email Now, Complete, Snooze, Dismiss, or Reopen where available.',
    ],
    legacyTerms: ['Upcoming Tasks', 'Upcoming'],
  },
  {
    question: 'Can I add maintenance tasks to my calendar from the website?',
    answers: [
      'Yes.',
      'In reminder or insight-supported flows, choose the calendar action.',
      'Google Calendar opens in a new tab, while Apple Calendar and ICS options download calendar files you can import.',
    ],
  },
  {
    question: 'What does Service History show?',
    answers: [
      'Service History gives a chronological view of completed service and ownership events.',
      'Use it to verify completed work, ordering of events, and long-term lifecycle trends.',
    ],
    legacyTerms: ['Timeline'],
  },
  {
    question: 'How do I find nearby shops and services?',
    answers: [
      'Open Shops & Services.',
      'Enter location context and search criteria.',
      'Use the business-type filter to narrow the results.',
    ],
    legacyTerms: ['Mechanic', 'Mechanics', 'Service Providers'],
  },
  {
    question: 'How do Account preferences affect reminders?',
    answers: [
      'Account settings include reminder lead-time and usage assumptions (for example average driving patterns) that control how early Maintenance Plan starts surfacing service work.',
      'These values influence when reminder windows appear.',
      'Save account preferences to apply changes.',
    ],
    legacyTerms: ['Profile'],
  },
  {
    question: 'Can I store location and shop preferences?',
    answers: [
      'Yes.',
      'Account supports location fields and nearby-search preferences.',
      'These settings are used by Shops & Services search behavior.',
    ],
  },
  {
    question: 'What is the Subscriptions page for?',
    answers: [
      'Subscriptions and billing explains the available options and limits.',
      'Use it to compare subscription tiers and see what is included right now.',
    ],
  },
  {
    question: 'How do I export maintenance history on the website?',
    answers: [
      'Open a vehicle in Edit Vehicle.',
      'Use export actions for CSV or PDF where your current tier allows access.',
      'If a format is locked, upgrade prompts can appear to explain the required subscription tier.',
    ],
  },
  {
    question: 'How do I contact support from the website?',
    answers: [
      'Open Support from footer or support links in help pages.',
      'Provide issue summary, environment, and steps to reproduce.',
      'Include relevant VIN/context when asking about record-specific issues.',
    ],
  },
  {
    question: 'When should I use Help or Getting Started?',
    answers: [
      'Use Getting Started when you are new and want the simple setup steps.',
      'Use Help when something is confusing or not working as expected.',
      'The Product Tour uses current screenshots and task-based walkthrough links.',
    ],
  },
  {
    question: 'Why do I sometimes see poster images instead of videos?',
    answers: [
      'The current Product Tour uses verified screenshots and task-based walkthrough links.',
      'Videos will be added only after they are recaptured from the current release and reviewed for accuracy.',
    ],
  },
];

export const iosFaq: FaqItem[] = [
  {
    question: 'How do I start using the iOS app?',
    answers: [
      'Install and open Vehicle-Vitals on your iPhone.',
      'Choose Create Account if you are new, or Sign In if you already use the web app.',
      'After signing in, Garage shows the vehicles saved to that account.',
    ],
  },
  {
    question: 'How do I sign up on iOS?',
    answers: [
      'Choose Create Account from the welcome or sign-in screen.',
      'Enter email and password details.',
      'Submit and continue to the app once account creation succeeds.',
    ],
  },
  {
    question: 'How do I sign in on iOS?',
    answers: [
      'Open Login.',
      'Enter email and password, then Sign In.',
      'After a successful sign-in, Garage opens.',
    ],
  },
  {
    question: 'How do I reset my password on iOS?',
    answers: [
      'From Login, open Forgot Password.',
      'Submit your email and follow reset instructions.',
      'Return to Login and sign in with your updated password.',
    ],
  },
  {
    question: 'How do I add a vehicle on iOS?',
    answers: [
      'From Garage, tap Add Vehicle.',
      'Select the vehicle type (passenger vehicle, commercial vehicle, motorcycle, RV, boat, trailer, or other).',
      'Enter a vehicle ID (VIN/HIN/Serial), then use lookup if it is a VIN, or fill fields manually.',
      'Provide mileage and save.',
      'If the account has reached its vehicle limit, review Plans & Billing or contact Support.',
    ],
  },
  {
    question: 'Can I scan a VIN on iOS?',
    answers: [
      'Yes.',
      'Use the Scan VIN route and confirm captured VIN.',
      'Continue to add/edit flow to look up and save.',
    ],
  },
  {
    question: 'What happens if lookup fails on iOS?',
    answers: [
      'The app shows an error and you can retry.',
      'You can still enter vehicle details manually and save using your vehicle ID.',
    ],
  },
  {
    question: 'How do I edit an existing vehicle on iOS?',
    answers: [
      'Open the vehicle from Garage.',
      'Choose Edit Vehicle.',
      'Update details and save.',
    ],
  },
  {
    question: 'How do I view and manage maintenance records on iOS?',
    answers: [
      'Open vehicle Records.',
      'Edit record categories/items, upload attachments, and save changes.',
      'Use retry actions for failed uploads.',
    ],
  },
  {
    question: 'Can I open and delete uploaded record files on iOS?',
    answers: [
      'Yes.',
      'Record attachments support open and delete operations in Records.',
    ],
  },
  {
    question: 'How do I use Maintenance Plan on iOS?',
    answers: [
      'Open Maintenance Plan from app navigation.',
      'Review tasks sorted by urgency.',
      'Save reminders and use actions like complete/snooze/dismiss/reopen where shown.',
    ],
    legacyTerms: ['Upcoming Tasks', 'Upcoming'],
  },
  {
    question: 'How do I add a maintenance event to calendar on iOS?',
    answers: [
      'In Maintenance Plan or related maintenance flows, choose Add to Calendar.',
      'The app creates an event via calendar integration service and confirms success/failure.',
    ],
  },
  {
    question: 'What does Service History do on iOS?',
    answers: [
      'Service History shows maintenance events in chronological order.',
      'Use it to trace ownership and service history over time.',
    ],
    legacyTerms: ['Timeline'],
  },
  {
    question: 'Where do I configure reminder and calendar preferences on iOS?',
    answers: [
      'Open account-related settings screens: Reminder Preferences, Calendar Preferences, and Email Preferences.',
      'Adjust values and save.',
    ],
  },
  {
    question: 'How do notifications work on iOS?',
    answers: [
      'Allow notification permissions when prompted.',
      'Foreground reminders and notification routing are handled by app notification services.',
      'If disabled at OS level, enable them in iOS Settings.',
    ],
  },
  {
    question: 'How do I view account details and sign out on iOS?',
    answers: [
      'Open Account from the app navigation.',
      'Use Sign Out action when needed.',
    ],
    legacyTerms: ['Profile'],
  },
  {
    question: 'How do I find shops and services on iOS?',
    answers: [
      'Open Shops & Services from Settings.',
      'Search using your location and business-type options.',
    ],
    legacyTerms: ['Mechanic', 'Mechanics', 'Service Providers'],
  },
  {
    question: 'What is the Premium screen for on iOS?',
    answers: [
      'Plans & Billing explains the current account tier and planned subscription options.',
      'If your current subscription limits vehicle count, the app may point you here.',
    ],
  },
  {
    question: 'How do I export maintenance data on iOS?',
    answers: [
      "Open a vehicle's Maintenance list.",
      'Use the export menu and select CSV, PDF, or Excel based on subscription availability.',
      'If a premium format is restricted, upgrade paths are shown.',
    ],
  },
  {
    question: 'How do I contact support from iOS?',
    answers: [
      'Use Support screen in app routes.',
      'Provide device model, iOS version, and steps that reproduce the issue.',
    ],
  },
  {
    question: 'What should I include when reporting a bug?',
    answers: [
      'Include platform (web or iOS), timestamp, affected VIN (if safe to share), expected result, actual result, and screenshots if available.',
      'This shortens resolution time significantly.',
    ],
  },
];

export const troubleshootingFaq: FaqItem[] = [
  {
    question: 'I cannot sign in even with correct password. What should I do?',
    answers: [
      'Confirm email spelling and keyboard auto-correct behavior.',
      'Reset password from Forgot Password.',
      'If issue persists, visit Support with timestamp and environment.',
    ],
  },
  {
    question: 'A vehicle does not appear after saving. What should I check?',
    answers: [
      'Verify network connectivity.',
      'Refresh Garage/Home.',
      'Confirm vehicle ID and required fields.',
      'If still missing, log out/in and re-check.',
    ],
  },
  {
    question: 'Reminder actions appear delayed. Is this normal?',
    answers: [
      'Small propagation delays can occur after save/complete/snooze operations.',
      'Refresh Maintenance Plan and re-open the task list.',
    ],
  },
  {
    question: 'Calendar event creation failed. What can I try?',
    answers: [
      'Check calendar permissions at OS/browser level.',
      'Retry from task screen.',
      'If repeated failures occur, share error message with support.',
    ],
  },
  {
    question: 'Uploaded record file failed. What can I do?',
    answers: [
      'Retry upload from the same record item.',
      'Check file size/type constraints and network stability.',
      'If necessary, split large files and upload separately.',
    ],
  },
];

export const websiteRoutes = [
  '/ (marketing landing)',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/app',
  '/app/add-vehicle',
  '/app/edit-vehicle/:vin',
  '/app/records/:vin',
  '/app/upcoming',
  '/app/timeline',
  '/app/profile',
  '/app/providers',
  '/app/subscription',
  '/help',
  '/getting-started',
];

export const iosRoutes = [
  '/marketing',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/app',
  '/app/add-vehicle',
  '/app/scan-vin',
  '/app/records/:vin',
  '/app/upcoming',
  '/app/timeline',
  '/app/profile',
  '/app/service-providers',
  '/app/premium',
  '/app/calendar-preferences',
  '/app/reminder-preferences',
  '/app/email-preferences',
  '/app/offline-settings',
  '/app/analytics',
];
