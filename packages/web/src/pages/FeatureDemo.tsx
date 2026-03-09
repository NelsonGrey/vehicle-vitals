import { Link } from 'react-router-dom';

interface FeatureDemoProps {
  title: string;
  subtitle: string;
  marketingBullets: string[];
  appRoute: string;
  appCtaLabel: string;
}

export default function FeatureDemo({
  title,
  subtitle,
  marketingBullets,
  appRoute,
  appCtaLabel,
}: FeatureDemoProps) {
  return (
    <div className="max-w-4xl mx-auto px-5 py-8 space-y-6">
      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h1 className="font-serif text-4xl text-slate-900 dark:text-slate-100 mb-3">
          {title} Demo
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">{subtitle}</p>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 mb-4">
          What You See On The Marketing Side
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed">
          {marketingBullets.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 className="font-serif text-2xl text-slate-900 dark:text-slate-100 mb-3">
          How It Is Implemented In The User App
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Sign in and jump directly to the secured app flow for this capability.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/auth/login"
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Sign In
          </Link>
          <Link
            to="/auth/signup"
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Create Account
          </Link>
          <Link
            to={appRoute}
            className="px-4 py-2 bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 rounded-lg border border-slate-700 dark:border-slate-300 hover:opacity-90"
          >
            {appCtaLabel}
          </Link>
        </div>
      </section>

      <div>
        <Link
          to="/"
          className="text-slate-700 dark:text-slate-300 hover:underline"
        >
          Back to Marketing Home
        </Link>
      </div>
    </div>
  );
}
