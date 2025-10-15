import { useState } from 'react';
import AdBanner from '../components/AdBanner';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ComingSoon() {
  const [email, setEmail] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const db = getFirestore();
      await addDoc(collection(db, 'launch_signups'), {
        email,
        timestamp: serverTimestamp(),
        source: 'coming_soon_page'
      });
      setSubmitStatus('success');
      setEmail('');
    } catch (error) {
      console.error('Error saving email signup:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim()) return;

    setIsSubmitting(true);
    try {
      const db = getFirestore();
      await addDoc(collection(db, 'user_suggestions'), {
        suggestion: suggestion.trim(),
        timestamp: serverTimestamp(),
        source: 'coming_soon_page'
      });
      setSubmitStatus('suggestion_success');
      setSuggestion('');
    } catch (error) {
      console.error('Error saving suggestion:', error);
      setSubmitStatus('suggestion_error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              🚗 Vehicle Vitals
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Coming Soon!
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            We&apos;re building the ultimate vehicle management platform. Track maintenance, monitor performance,
            and keep your vehicles running smoothly with AI-powered insights.
          </p>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              Get Notified When We Launch
            </h2>
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Signing up...' : 'Notify Me'}
              </button>
            </form>
            {submitStatus === 'success' && (
              <p className="mt-4 text-green-600 dark:text-green-400">
                ✅ Thanks! We&apos;ll notify you when we launch.
              </p>
            )}
            {submitStatus === 'error' && (
              <p className="mt-4 text-red-600 dark:text-red-400">
                ❌ Something went wrong. Please try again.
              </p>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">
            What Vehicle Vitals Will Offer
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Mobile Apps
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Native iOS and Android apps for on-the-go vehicle management. Scan VIN codes,
                track fuel efficiency, and get maintenance reminders.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Smart Maintenance Tracking
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                AI-powered maintenance schedules based on your driving habits, vehicle age,
                and manufacturer recommendations. Never miss a service again.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Performance Analytics
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Detailed insights into fuel economy, maintenance costs, and vehicle health.
                Compare performance across your fleet.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">📷</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                VIN Scanning
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Instantly decode vehicle information by scanning VIN codes. Get detailed specs,
                recall information, and market value estimates.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Smart Notifications
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Get timely reminders for oil changes, tire rotations, inspections, and more.
                Customizable alerts based on your schedule.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Cost Tracking
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Monitor maintenance expenses, fuel costs, and depreciation. Make informed
                decisions about repairs and vehicle upgrades.
              </p>
            </div>
          </div>
        </section>

        {/* Suggestion Form */}
        <section className="mb-16">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 text-center">
              Have a Suggestion?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6 text-center">
              We&apos;re building Vehicle Vitals for vehicle owners like you. What features would you love to see?
            </p>
            <form onSubmit={handleSuggestionSubmit} className="space-y-4">
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="Share your ideas for Vehicle Vitals..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
              </button>
            </form>
            {submitStatus === 'suggestion_success' && (
              <p className="mt-4 text-green-600 dark:text-green-400 text-center">
                ✅ Thanks for your suggestion! We&apos;ll consider it as we build.
              </p>
            )}
            {submitStatus === 'suggestion_error' && (
              <p className="mt-4 text-red-600 dark:text-red-400 text-center">
                ❌ Something went wrong. Please try again.
              </p>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center">
          <AdBanner />
          <p className="text-slate-500 dark:text-slate-400 mt-8">
            © 2025 Vehicle Vitals. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
