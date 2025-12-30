import { useState } from 'react';
import StackedVLogo from '../components/StackedVLogo';
import SiteFooter from '../components/SiteFooter';
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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-5 py-6">
          <div className="flex items-center justify-center">
            <StackedVLogo
              size={40}
              showText={true}
              color="currentColor"
              accent="#334155"
              wordmarkColor="#64748b"
            />
          </div>
        </div>
      </header>

      <main className="pt-8 pb-16">
        {/* Hero Section */}
        <section className="bg-slate-100 dark:bg-slate-800 py-20">
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center py-12 max-w-4xl mx-auto">
              <div className="text-slate-600 dark:text-slate-400 uppercase tracking-widest text-xs font-bold mb-3">Care for every mile</div>
              <div className="font-serif text-5xl leading-tight mb-4 text-slate-900 dark:text-slate-100">Coming Soon</div>
              <div className="text-lg max-w-prose text-slate-700 dark:text-slate-300 mb-8">We&apos;re putting the finishing touches on Vehicle Vitals. Track your vehicle&apos;s story with confidence—on web and mobile.</div>

              {/* Email Signup Form */}
              <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-8 rounded-xl shadow-sm max-w-md mx-auto mb-12">
                <h3 className="font-serif font-semibold text-xl text-slate-900 dark:text-slate-100 mb-4">
                  Get notified when we launch
                </h3>
                <form onSubmit={handleEmailSignup} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
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

            {/* Suggestion Form */}
            <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-8 rounded-xl shadow-sm max-w-2xl mx-auto mt-12">
              <h3 className="font-serif font-semibold text-xl text-slate-900 dark:text-slate-100 mb-4 text-center">
                Have a suggestion?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 text-center">
                We&apos;re building Vehicle Vitals for vehicle owners like you. What features would you love to see?
              </p>
              <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                <textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="Share your ideas for Vehicle Vitals..."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent dark:bg-slate-800 dark:text-white resize-none"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
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
