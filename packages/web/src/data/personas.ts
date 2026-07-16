export type PersonaId =
  'owners' | 'households' | 'new-drivers' | 'diy-maintainers' | 'light-fleets';

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
    navLabel: 'Ownership Records',
    label: 'Ownership records',
    title: 'Keep every service record ready when it matters',
    headline:
      'A clean record for every service visit, receipt, reminder, and repair decision.',
    pain: 'Receipts, service dates, warranty proof, and shop recommendations get scattered across email, glove boxes, and memory.',
    outcome:
      'Build a trusted ownership record, see what is due next, and keep resale or warranty evidence ready.',
    plan: 'Start Free for core tracking. Upgrade to Pro when you want exports, calendar sync, and advanced reminders.',
    recommendedPlan: 'Free to Pro',
    image: '/images/features/current/records.png',
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
      'Review Service History before the next shop visit or sale.',
    ],
  },
  {
    id: 'households',
    navLabel: 'Household Vehicles',
    label: 'Household vehicles',
    title: 'Keep household vehicle records together',
    headline:
      'One account can organize the vehicles, upcoming work, and ownership costs used by your household.',
    pain: 'Multiple vehicles and service schedules are difficult to track when records are split across receipts, inboxes, and different reminders.',
    outcome:
      'Use one garage view to track household vehicles, upcoming work, service costs, and history from the signed-in account.',
    plan: 'Pro is the best fit for households that need reminders, exports, calendar sync, and more planning depth. Additional member invitations and shared roles are planned but are not part of the current launch.',
    recommendedPlan: 'Pro',
    image: '/images/features/current/garage.png',
    ctaLabel: 'See garage overview',
    demoTo: '/cross-platform-access-demo',
    path: '/personas/households',
    accent:
      'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-100',
    benefits: [
      'See household vehicle records and upcoming work in one garage view.',
      'Keep recurring maintenance visible without relying on memory.',
      'Keep records ready when a household vehicle changes hands or needs documentation.',
    ],
    workflows: [
      'Add each household vehicle to the garage.',
      'Review the Maintenance Plan across the household vehicles in the account.',
      'Use records and reminders to prepare for upcoming service.',
    ],
  },
  {
    id: 'new-drivers',
    navLabel: 'Guided Setup',
    label: 'Guided setup',
    title: 'Know what to track from day one',
    headline:
      'A practical way to understand what happened, what matters, and what to ask next.',
    pain: 'New owners and drivers often know a vehicle needs care, but not which records matter, what a fair next step is, or how to talk with a shop.',
    outcome:
      'Capture each service, learn the next step, and keep provider notes in language that makes future decisions easier.',
    plan: 'Free covers the early habit. Pro adds planning depth when reminders, exports, and records start to matter more.',
    recommendedPlan: 'Free to Pro',
    image: '/images/features/current/add-vehicle.png',
    ctaLabel: 'See quick setup',
    demoTo: '/vin-lookup-demo',
    path: '/personas/new-drivers',
    accent:
      'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100',
    benefits: [
      'Turn confusing service paperwork into an understandable vehicle history.',
      'Learn what questions to ask before approving work.',
      'Create good maintenance habits from the first vehicle or first ownership year.',
    ],
    workflows: [
      'Start with VIN lookup and a basic vehicle profile.',
      'Save the first service record and receipt.',
      'Use upcoming tasks to learn what deserves attention next.',
    ],
  },
  {
    id: 'diy-maintainers',
    navLabel: 'Hands-On Maintenance',
    label: 'Hands-on maintenance',
    title: 'Document the work you do yourself',
    headline:
      'Parts, labor notes, intervals, photos, and receipts organized like a professional service history.',
    pain: 'Hands-on maintenance can save money, but the proof often lives in parts orders, notebooks, and memory instead of a record buyers or mechanics can trust.',
    outcome:
      'Capture parts, costs, service intervals, and project notes so self-performed work still builds vehicle value.',
    plan: 'Pro fits active hands-on tracking. Premium adds longer planning, ad-free work sessions, and automation for power users.',
    recommendedPlan: 'Pro to Premium',
    image: '/images/features/current/records.png',
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
      'Log hands-on work with parts, cost, mileage, and notes.',
      'Review intervals before the next weekend project.',
      'Export a clean maintenance history when proof matters.',
    ],
  },
  {
    id: 'light-fleets',
    navLabel: 'Work Vehicles',
    label: 'Work vehicles',
    title: 'Keep work-vehicle records organized',
    headline:
      'Maintenance history, costs, and provider notes for a small set of work vehicles.',
    pain: 'Service records, costs, and provider details are hard to retrieve when work-vehicle information is split across invoices and spreadsheets.',
    outcome:
      'Track work-vehicle history, upcoming recommendations, costs, and provider context from one account.',
    plan: 'Premium supports power users and light operations. Enterprise fits policy, SLA, reporting, and integration needs. Team roles, fleet reporting, and integrations are planned capabilities.',
    recommendedPlan: 'Premium to Enterprise',
    image: '/images/features/current/maintenance-plan.png',
    ctaLabel: 'See maintenance planning',
    demoTo: '/maintenance-planning-demo',
    path: '/personas/light-fleets',
    accent:
      'border-indigo-200 bg-indigo-50 text-indigo-950 dark:border-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-100',
    benefits: [
      'Move work-vehicle service history out of scattered invoices and spreadsheets.',
      'Review available maintenance recommendations before the next service visit.',
      'Keep costs and provider context attached to each vehicle record.',
    ],
    workflows: [
      'Track work vehicles and provider history in one garage.',
      'Review available maintenance recommendations and saved reminders.',
      'Contact Support to discuss planned team workflows as operations grow.',
    ],
  },
];

export function getPersonaById(
  personaId: string | undefined
): PersonaPageContent | undefined {
  return personaPages.find(persona => persona.id === personaId);
}
