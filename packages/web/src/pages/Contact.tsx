// Header and footer provided by Layout

export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-5 py-6 sm:py-8 space-y-5 sm:space-y-6">
      <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 shadow-sm">
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-slate-900 dark:text-slate-100 mb-4">
          Contact Us
        </h1>
        <p className="text-slate-700 dark:text-slate-300 mb-4">
          We'd love to hear from you. For support, feedback, or questions, send
          us an email:
        </p>
        <p className="mb-4">
          <a
            href="mailto:support@vehicle-vitals.com"
            className="text-slate-800 dark:text-slate-200 underline hover:no-underline rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"
          >
            support@vehicle-vitals.com
          </a>
        </p>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          Include your browser/app version and a brief description of the issue
          to help us assist you faster.
        </p>
      </section>
    </div>
  );
}
