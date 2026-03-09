import AdBanner from './AdBanner';

export default function HeaderAdBar() {
  return (
    <div className="fixed top-20 left-0 right-0 z-[9] border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
      <div className="max-w-6xl mx-auto px-5 py-1">
        <AdBanner className="my-0" />
      </div>
    </div>
  );
}
