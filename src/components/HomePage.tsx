import React from "react";
import { AuthPage } from "./AuthPage";
import { FaInstagram, FaFacebookF, FaLinkedinIn, FaYoutube } from "react-icons/fa";

// Simple Card Icon Component
const CardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <rect x="4" y="8" width="24" height="16" rx="4" fill="url(#grad)" />
    <rect x="7" y="14" width="10" height="2" rx="1" fill="#fff" />
    <rect x="7" y="18" width="6" height="2" rx="1" fill="#fff" />
    <circle cx="23" cy="20" r="2" fill="#fff" />
    <defs>
      <linearGradient id="grad" x1="4" y1="8" x2="28" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#10b981" />
      </linearGradient>
    </defs>
  </svg>
);

const HomePage = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-r from-blue-100 via-white to-purple-100 relative">
    {/* Background decoration */}
    <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
    <div className="absolute top-20 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
    <div className="absolute bottom-10 left-1 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
    <div className="absolute top-10 center w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>

    {/* Company Branding - Bottom Center */}
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-20">
      <img
        src="https://review.sccinfotech.com/scc.png"
        alt="SCC Infotech LLP Logo"
        className="w-16 h-16 object-contain"
      />
      <div>
        <div className="flex items-center gap-1 text-lg">
          <span className="text-gray-500 font-normal text-xl">AI</span>
          <span className="text-yellow-500 text-xl">✨</span>
          <span className="font-semibold text-purple-500 " style={{ letterSpacing: 1 }}>Powered</span>
        </div>
        <div
          className="text-xl font-bold tracking-wide leading-tight bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text"
        >
          SCC INFOTECH LLP
        </div>
      </div>
    </div>

    <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-7xl gap-12 relative z-10">
      {/* Left Column - Visual */}
      <div className="relative flex-1 flex items-center justify-center">
        <div className="relative w-full bg-white rounded-3xl shadow-2xl p-5 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
          <div className="absolute -top-3 -left-8 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-semibold shadow-md animate-bounce z-10">
            🚀 Stand Out Online
          </div>
          <div className="absolute -top-5 -right-5 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md z-10">
            Digital Card ✨
          </div>
          {/* Header */}
          <div className="text-xl font-bold text-center text-blue-700 mb-6 tracking-wide">
            Digital Business Cards
          </div>
          {/* Mock Digital Business Card */}
          <div className="bg-gray-50 rounded-xl p-8 shadow-inner">
            {/* <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <CardIcon className="w-8 h-8" />
              </div>
              <div className="ml-3">
                <h3 className="font-semibold text-gray-900">Digital Business Card</h3>
                <p className="text-sm text-gray-500">Share your professional identity</p>
              </div>
            </div> */}
            <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-blue-500 shadow relative">
              {/* Social Media Icons - Top Right */}
              <div className="absolute top-2 -right-5 flex flex-col gap-1 z-10">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-yellow-400 text-white hover:scale-110 transition-transform shadow">
                  <FaInstagram size={18} />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 text-white hover:scale-110 transition-transform shadow">
                  <FaFacebookF size={18} />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-700 text-white hover:scale-110 transition-transform shadow">
                  <FaLinkedinIn size={18} />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-red-600 text-white hover:scale-110 transition-transform shadow">
                  <FaYoutube size={18} />
                </a>
              </div>
              <div className="flex">
                {/* Left: Profile and Info */}
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <img
                      src="https://randomuser.me/api/portraits/men/32.jpg"
                      alt="Profile"
                      className="w-16 h-16 rounded-full border-2 border-blue-400 mr-3"
                    />
                    <div>
                      <div className="font-bold text-lg text-gray-900">Alex Johnson</div>
                      <div className="text-sm text-gray-500">Product Manager</div>
                      <div className="text-xs text-gray-400">Acme Corp</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mb-1">
                    <span className="font-semibold">Email:</span> alex.johnson@email.com
                  </div>
                  <div className="text-sm text-gray-700 mb-1">
                    <span className="font-semibold">Phone:</span> +91 11223 45678
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-semibold">Website:</span> www.alexjohnson.com
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow">
              📇 Share My Card
            </button>
          </div>
          <div className="absolute -bottom-5 -right-5 bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md animate-pulse z-10">
            🌟 Make Connections
          </div>
        </div>
      </div>

      {/* Right Column - AuthPage */}
      <div className="flex-1 flex items-center justify-center">
        <AuthPage />
      </div>
    </div>
  </div>
);

export default HomePage;