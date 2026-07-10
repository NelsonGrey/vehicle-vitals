// Header and footer provided by Layout
import { useState } from 'react';
import {
  SUPPORT_REQUEST_TOPICS,
  submitSupportRequest,
} from '../utils/supportRequestService';

export default function Support() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await submitSupportRequest({ name, email, topic, message });
      setSubmitted(true);
      setName('');
      setEmail('');
      setTopic('');
      setMessage('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send your message'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-6 sm:py-8 space-y-5 sm:space-y-6">
      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-slate-900 dark:text-slate-100 mb-4">
          Support
        </h1>
        <p className="text-slate-700 dark:text-slate-300 mb-6">
          We typically respond within 24 hours.
        </p>

        {submitted ? (
          <div
            role="status"
            className="rounded-lg border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-950/40 px-4 py-3 text-accent-800 dark:text-accent-200"
          >
            Thanks — your message has been sent. We'll get back to you soon.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="topic"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Topic
              </label>
              <select
                id="topic"
                required
                value={topic}
                onChange={event => setTopic(event.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              >
                <option value="" disabled>
                  Select a topic…
                </option>
                {SUPPORT_REQUEST_TOPICS.map(topicOption => (
                  <option key={topicOption} value={topicOption}>
                    {topicOption}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Message
              </label>
              <textarea
                id="message"
                required
                rows={6}
                value={message}
                onChange={event => setMessage(event.target.value)}
                placeholder="Describe your issue or question in as much detail as possible…"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 resize-none"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-rose-800 dark:text-rose-200"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
            >
              {submitting ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
