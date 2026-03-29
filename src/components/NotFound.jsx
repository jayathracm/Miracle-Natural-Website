import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-accent-500 mb-4">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"
              />
            </svg>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved. Let's
            get you back on track.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full px-10 py-4 rounded-full text-lg font-bold bg-accent-500 text-white shadow-lg hover:bg-accent-600 transition-all duration-200"
          >
            Go to Homepage
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full px-10 py-4 rounded-full text-lg font-bold border-2 border-accent-500 text-accent-500 bg-white shadow hover:bg-accent-50 transition-all duration-200"
          >
            Go Back
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <Link to="/" className="text-blue-600 hover:text-blue-700">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
