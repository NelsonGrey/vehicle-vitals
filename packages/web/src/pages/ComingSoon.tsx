import AdBanner from '../components/AdBanner';
// Header and footer provided by Layout

export default function ComingSoon() {
  return (
    <section className="bg-slate-100 dark:bg-slate-800 py-20 min-h-[calc(100vh-200px)]">
      <div className="container flex justify-center items-center min-h-full">
        <div className="text-center max-w-2xl">
          <div className="text-slate-600 dark:text-slate-400 text-sm font-medium uppercase tracking-wider mb-4">Vehicle Vitals</div>
          <div className="text-slate-900 dark:text-slate-100 text-4xl font-bold mb-6">Coming Soon!</div>
          <div className="text-slate-700 dark:text-slate-300 text-lg mb-8">We&apos;re putting the finishing touches on Vehicle Vitals. Check back soon.</div>
          <div className="mt-8">
            <AdBanner />
          </div>
        </div>
      </div>
    </section>
  );
}
