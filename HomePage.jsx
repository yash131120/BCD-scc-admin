import React from "react";

// Simple Star Icon Component
const Star = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <polygon points="10,2 12.59,7.36 18.51,8.09 14,12.26 15.18,18.09 10,15.27 4.82,18.09 6,12.26 1.49,8.09 7.41,7.36" />
  </svg>
);

const HomePage = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-100">
    {/* Right Column - Visual */}
    <div className="relative">
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
        <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
          AI Powered ✨
        </div>
        {/* Mock Phone Interface */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              AI
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900">Review Generator</h3>
              <p className="text-sm text-gray-500">Rate your experience</p>
            </div>
          </div>
          <div className="flex justify-center mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-8 h-8 text-yellow-400 fill-current mx-1" />
            ))}
          </div>
          <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-blue-500">
            <p className="text-gray-700 text-sm italic">
              "Amazing service! The staff was incredibly helpful and the food was delicious. Highly recommend this restaurant to anyone looking for great dining experience!"
            </p>
          </div>
          <button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow">
            📋 Copy & Post to Google
          </button>
        </div>
      </div>
      {/* Floating Elements */}
      <div className="absolute -top-8 -left-8 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-semibold animate-bounce">
        🚀 +300% Reviews
      </div>
      <div className="absolute -bottom-8 -right-8 bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold animate-pulse">
        🌟 5-Star Reviews
      </div>
    </div>
  </div>
);

export default HomePage;