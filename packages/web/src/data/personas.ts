export type PersonaId =
  | 'owners'
  | 'households'
  | 'new-drivers'
  | 'diy-maintainers'
  | 'light-fleets';

export interface PersonaPageContent {
  id: PersonaId;
  navLabel: string;
  label: string;
  title: string;
  headline: string;
  pain: string;
  outcome: string;
  plan: string;
  recommendedPlan: string;
  image: string;
  ctaLabel: string;
  demoTo: string;
  path: string;
  accent: string;
  benefits: string[];
  workflows: string[];
}

export const personaPages: PersonaPageContent[] = [
  {
    id: 'owners',
    navLabel: 'For Owners',
    label: 'Responsible owner',
    title: 'Keep one car reliable and documented',
    headline:
      'A clean record for every service visit, receipt, reminder, and repair decision.',
    pain: 'Receipts, service dates, warranty proof, and shop recommendations get scattered across email, glove boxes, and memory.',
    outcome:
      'Build a trusted ownership record, see what is due next, and keep resale or warranty evidence ready.',
    plan: 'Start Free for core tracking. Upgrade to Pro when you want exports, calendar sync, and advanced reminders.',
    recommendedPlan: 'Free to Pro',
    image: '/images/features/records.png',
    ctaLabel: 'See ownership history',
    demoTo: '/ownership-history-demo',
    path: '/personas/owners',
    accent:
      'border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-100',
    benefits: [
      'Keep service history and receipts tied to the right vehicle.',
      'Know what is due before a missed service turns into a bigger bill.',
      'Share credible records for resale, warranty, insurance, or mechanic conversations.',
    ],
    workflows: [
      'Add a vehicle and confirm the profile.',
      'Log maintenance, repairs, receipts, costs, and notes.',
      'Review timeline history before the next shop visit or sale.',
    ],
  },
  {
    id: 'households',
    navLabel: 'For Households',
    label: 'Household garage',
    title: 'Coordinate every vehicle in the family',
    headline:
      'One shared view for drivers, vehicles, upcoming work, and ownership costs.',
    pain: 'Multiple cars, drivers, and service schedules turn into text threads, missed handoffs, and duplicate shop follow-up.',
    outcome:
      'Use one garage view to track vehicles, upcoming work, service costs, and shared history.',
    plan: 'Pro is the best fit for households that need reminders, exports, calendar sync, and shared planning depth.',
    recommendedPlan: 'Pro',
    image: '/images/features/garage-vehicles.png',
    ctaLabel: 'See garage overview',
    demoTo: '/cross-platform-access-demo',
    path: '/personas/households',
    accent:
      'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-100',
    benefits: [
      'See the whole garage without chasing each driver for updates.',
      'Coordinate recurring maintenance around calendars and responsibilities.',
      'Export records when a family vehicle changes hands or needs documentation.',
    ],
    workflows: [
      'Add each household vehicle to the garage.',
      'Review upcoming tasks across the shared garage.',
      'Use exports and reminders to keep everyone aligned.',
    ],
  },
  {
    id: 'new-drivers',
    navLabel: 'New Drivers',
    label: 'New driver or new owner',
    title: 'Build confidence with plain-language maintenance guidance',
    headline:
      'A practical way to understand what happened, what matters, and what to ask next.',
    pain: 'New owners and drivers often know a vehicle needs care, but not which records matter, what a fair next step is, or how to talk with a shop.',
    outcome:
      'Capture each service, learn the next step, and keep provider notes in language that makes future decisions easier.',
    plan: 'Free covers the early habit. Pro adds planning depth when reminders, exports, and records start to matter more.',
    recommendedPlan: 'Free to Pro',
    image: '/images/features/add-vehicle.png',
    ctaLabel: 'See quick setup',
    demoTo: '/vin-decode-demo',
    path: '/personas/new-drivers',
    accent:
      'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100',
    benefits: [
      'Turn confusing service paperwork into an understandable vehicle history.',
      'Learn what questions to ask before approving work.',
      'Create good maintenance habits from the first car or first ownership year.',
    ],
    workflows: [
      'Start with VIN lookup and a basic vehicle profile.',
      'Save the first service record and receipt.',
      'Use upcoming tasks to learn what deserves attention next.',
    ],
  },
  {
    id: 'diy-maintainers',
    navLabel: 'DIY',
    label: 'DIY maintainer',
    title: 'Document the work you do yourself',
    headline:
      'Parts, labor notes, intervals, photos, and receipts organized like a professional service history.',
    pain: 'DIY maintenance can save money, but the proof often lives in parts orders, notebooks, and memory instead of a record buyers or mechanics can trust.',
    outcome:
      'Capture parts, costs, service intervals, and project notes so self-performed work still builds vehicle value.',
    plan: 'Pro fits active DIY tracking. Premium adds longer planning, ad-free work sessions, and automation for power users.',
    recommendedPlan: 'Pro to Premium',
    image: '/images/features/records.png',
    ctaLabel: 'See record keeping',
    demoTo: '/ownership-history-demo',
    path: '/personas/diy-maintainers',
    accent:
      'border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-700 dark:bg-orange-950/30 dark:text-orange-100',
    benefits: [
      'Tie parts receipts, mileage, and notes to each completed job.',
      'Track recurring intervals for oil, brakes, tires, fluids, and project work.',
      'Show credible proof of self-performed maintenance when selling or diagnosing.',
    ],
    workflows: [
      'Log DIY work with parts, cost, mileage, and notes.',
      'Review intervals before the next weekend project.',
      'Export a clean maintenance history when proof matters.',
    ],
  },
  {
    id: 'light-fleets',
    navLabel: 'Light Fleets',
    label: 'Light fleet',
    title: 'Replace vehicle spreadsheets with operating visibility',
    headline:
      'Maintenance readiness, cost history, vendor context, and reporting for work vehicles.',
    pain: 'Downtime, vendor follow-up, driver handoffs, and cost reporting are hard to manage across work vehicles.',
    outcome:
      'Review service readiness, maintenance forecasts, exportable records, and provider context from one place.',
    plan: 'Premium supports power users and light operations. Enterprise fits policy, SLA, reporting, and integration needs.',
    recommendedPlan: 'Premium to Enterprise',
    image: '/images/features/upcoming.png',
    ctaLabel: 'See maintenance planning',
    demoTo: '/maintenance-planning-demo',
    path: '/personas/light-fleets',
    accent:
      'border-indigo-200 bg-indigo-50 text-indigo-950 dark:border-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-100',
    benefits: [
      'Move recurring vehicle work out of spreadsheets and text threads.',
      'Forecast service needs before they create scheduling or downtime problems.',
      'Give managers exportable records, vendor context, and policy-ready controls.',
    ],
    workflows: [
      'Track work vehicles and provider history in one garage.',
      'Review forecasted maintenance and upcoming tasks.',
      'Use reporting, integrations, and support as operations grow.',
    ],
  },
];

export function getPersonaById(
  personaId: string | undefined
): PersonaPageContent | undefined {
  return personaPages.find(persona => persona.id === personaId);
}
