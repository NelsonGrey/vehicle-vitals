import AdPlacement from './AdPlacement';

export default function HeaderAdBar() {
  return (
    <div className="shrink-0 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-5 py-2">
        <AdPlacement
          placement="header"
          className="my-0"
          hideLabel
          surface="flat"
        />
      </div>
    </div>
  );
}
