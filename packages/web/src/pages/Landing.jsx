import React from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import AdBanner from '../components/AdBanner';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <SiteHeader overlay={false} />
      <main className="pt-20 pb-16 min-h-[calc(100vh-5rem)]">
        {/* Clean Slate Hero Section */}
        <section className="bg-slate-100 dark:bg-slate-800 py-20">
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center py-12 max-w-4xl mx-auto">
              <div className="text-slate-600 dark:text-slate-400 uppercase tracking-widest text-xs font-bold mb-3">Care for every mile</div>
              <div className="font-serif text-5xl leading-tight mb-4 text-slate-900 dark:text-slate-100">Track your vehicle&apos;s story with confidence</div>
              <div className="text-lg max-w-prose text-slate-700 dark:text-slate-300 mb-8">Vehicle Vitals helps you log maintenance, plan service, and keep a timeless record—on web and mobile.</div>
              <div className="mt-8">
                <Link
                  to="/app"
                  className="inline-block px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium mr-4 transition-colors"
                >
                  Open the app
                </Link>
                <span className="text-slate-600 dark:text-slate-400">
                  or <Link to="/instructions" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline transition-colors">read the instructions</Link>
                </span>
              </div>
            </div>

            {/* Feature Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
              <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-6 rounded-xl shadow-sm">
                <h3 className="font-serif font-semibold text-xl text-slate-900 dark:text-slate-100 mb-3">VIN decode & quick add</h3>
                <p className="text-slate-600 dark:text-slate-400">Enter a VIN to prefill year, make, and model from the NHTSA database.</p>
              </div>
              <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-6 rounded-xl shadow-sm">
                <h3 className="font-serif font-semibold text-xl text-slate-900 dark:text-slate-100 mb-3">Maintenance, organized</h3>
                <p className="text-slate-600 dark:text-slate-400">Log services, notes, and costs. Stay on top of what&apos;s due next.</p>
              </div>
              <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-6 rounded-xl shadow-sm">
                <h3 className="font-serif font-semibold text-xl text-slate-900 dark:text-slate-100 mb-3">Your garage, anywhere</h3>
                <p className="text-slate-600 dark:text-slate-400">Access your vehicles from the web and our companion mobile apps.</p>
              </div>
              <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-6 rounded-xl shadow-sm">
                <h3 className="font-serif font-semibold text-xl text-slate-900 dark:text-slate-100 mb-3">Own your history</h3>
                <p className="text-slate-600 dark:text-slate-400">A clear record helps with resale and long-term care—one place to remember it all.</p>
              </div>
            </section>
            <div className="mt-12">
              <AdBanner />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
