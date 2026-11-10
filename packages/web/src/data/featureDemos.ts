/**
 * Public feature-demo routes. Shared by the client router and the post-build
 * HTML prerender so the two cannot drift.
 */
export interface FeatureDemoRoute {
  path: string;
  title: string;
  subtitle: string;
  marketingBullets: string[];
  appRoute: string;
  appCtaLabel: string;
}

export const featureDemoRoutes: FeatureDemoRoute[] = [
  {
    path: '/vin-lookup-demo',
    title: 'VIN Lookup',
    subtitle:
      'See how we turn a raw VIN into a structured vehicle profile in seconds.',
    marketingBullets: [
      'Enter a VIN and preview looked-up year, make, and model.',
      'Understand how quick add reduces setup friction.',
      'See the path from initial lookup to saved vehicle records.',
    ],
    appRoute: '/app/add-vehicle',
    appCtaLabel: 'Open VIN Add Flow',
  },
  {
    path: '/maintenance-planning-demo',
    title: 'Maintenance Planning',
    subtitle:
      'See how service planning becomes visible, organized, and predictable.',
    marketingBullets: [
      'Preview scheduled maintenance workflows and reminders.',
      'Understand how timeline and upcoming tasks connect.',
      'See how service history supports long-term ownership.',
    ],
    appRoute: '/app/upcoming',
    appCtaLabel: 'Open Maintenance Plan',
  },
  {
    path: '/cross-platform-access-demo',
    title: 'Cross Platform Access',
    subtitle: 'See how the same garage data follows users across devices.',
    marketingBullets: [
      'Understand web and mobile continuity from one account.',
      'Preview secure sign-in and shared data behavior.',
      'See where users continue work from any platform.',
    ],
    appRoute: '/app',
    appCtaLabel: 'Open Garage Dashboard',
  },
  {
    path: '/ownership-history-demo',
    title: 'Ownership History',
    subtitle:
      'See how long-term maintenance records become a single source of truth.',
    marketingBullets: [
      'Preview complete vehicle history and service chronology.',
      'Understand resale and ownership confidence benefits.',
      'See where records are maintained behind secure access.',
    ],
    appRoute: '/app/timeline',
    appCtaLabel: 'Open Service History',
  },
];
