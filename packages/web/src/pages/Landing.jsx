import React from 'react';
import { Link } from 'react-router-dom';
// Header and footer provided by Layout
import AdBanner from '../components/AdBanner';

export default function Landing() {
  const heroSrc = import.meta.env.VITE_HERO_IMAGE_URL || '/images/hero-garage.jpg';
  return (
    <div>
      {/* Full-bleed Hero Section */}
      <section
        className="relative border-none min-h-[calc(100vh-5rem)] bg-gray-900 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${heroSrc})`,
          filter: 'saturate(0.9) contrast(1.05)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 to-black/65" />
        <div className="relative z-10 flex items-center min-h-[calc(100vh-5rem)] py-12">
          <div className="max-w-6xl mx-auto px-5 w-full">
            <div className="text-white py-8 max-w-4xl">
              <div className="text-gold uppercase tracking-widest text-xs font-bold mb-1.5">Care for every mile</div>
              <div className="font-serif text-5xl leading-tight mb-2.5 text-white drop-shadow-lg">Track your vehicle's story with confidence</div>
              <div className="text-lg max-w-prose opacity-98 text-gray-100 drop-shadow-md mb-3.5">Vehicle Vitals helps you log maintenance, plan service, and keep a timeless record—on web and mobile.</div>
              <div className="mt-3.5">
                <Link 
                  to="/app" 
                  className="inline-block px-4 py-2.5 bg-oxblood text-primary-contrast rounded-lg border border-oxblood hover:opacity-90 transition-opacity no-underline font-medium mr-3"
                >
                  Open the app
                </Link>
                <span className="text-gray-100">
                  or <Link to="/instructions" className="text-gray-100 hover:text-white underline">read the instructions</Link>
                </span>
              </div>
            </div>

            {/* Feature Cards now overlaying the hero background */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white/8 border border-white/25 text-white backdrop-blur-sm backdrop-saturate-105 p-4 rounded-xl">
                <h3 className="font-serif font-semibold text-xl text-white mb-2">VIN decode & quick add</h3>
                <p className="text-white/85">Enter a VIN to prefill year, make, and model from the NHTSA database.</p>
              </div>
              <div className="bg-white/8 border border-white/25 text-white backdrop-blur-sm backdrop-saturate-105 p-4 rounded-xl">
                <h3 className="font-serif font-semibold text-xl text-white mb-2">Maintenance, organized</h3>
                <p className="text-white/85">Log services, notes, and costs. Stay on top of what's due next.</p>
              </div>
              <div className="bg-white/8 border border-white/25 text-white backdrop-blur-sm backdrop-saturate-105 p-4 rounded-xl">
                <h3 className="font-serif font-semibold text-xl text-white mb-2">Your garage, anywhere</h3>
                <p className="text-white/85">Access your vehicles from the web and our companion mobile apps.</p>
              </div>
              <div className="bg-white/8 border border-white/25 text-white backdrop-blur-sm backdrop-saturate-105 p-4 rounded-xl">
                <h3 className="font-serif font-semibold text-xl text-white mb-2">Own your history</h3>
                <p className="text-white/85">A clear record helps with resale and long-term care—one place to remember it all.</p>
              </div>
            </section>
            <div className="mt-6">
              <AdBanner />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
