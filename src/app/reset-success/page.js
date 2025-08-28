'use client';

import Link from 'next/link';

export default function ResetSuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 text-gray-700 relative flex items-center justify-center px-6">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 to-teal-700/10"></div>
      
      {/* Success content */}
      <div className="relative z-10 max-w-md w-full text-center">
        {/* Success icon */}
        <div className="mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
            <span className="text-4xl">✅</span>
          </div>
        </div>

        {/* Glass morphism card */}
        <div className="bg-white/25 backdrop-blur-20 border border-white/20 rounded-2xl p-8 shadow-2xl animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-6">
            Password Reset Successful!
          </h1>
          
          <div className="mb-8">
            <p className="text-lg text-gray-600 mb-4">
              🎉 Great news! Your password has been successfully updated.
            </p>
            <p className="text-gray-600">
              You can now log in using your new credentials and access your account.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-medium rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-xl"
            >
              <span className="mr-2">🔐</span>
              Go to Login
            </Link>
            
            <div className="text-sm text-gray-500">
              <p>Ready to get back to cleaning! 🧹</p>
            </div>
          </div>
        </div>

        {/* Additional help section */}
        <div className="mt-8 bg-white/25 backdrop-blur-20 border border-white/20 rounded-2xl p-6 animate-fade-in-delayed">
          <h3 className="text-lg font-semibold text-teal-800 mb-2">Security Tips</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>🔒 Keep your password secure and don&apos;t share it with anyone</p>
            <p>💪 Consider using a strong, unique password</p>
            <p>📱 Enable two-factor authentication for extra security</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-6 flex justify-center gap-4 text-sm">
          <Link 
            href="/how-it-works" 
            className="text-teal-600 hover:text-teal-800 transition-colors duration-300 hover:underline"
          >
            How It Works
          </Link>
          <span className="text-gray-400">•</span>
          <Link 
            href="/contact" 
            className="text-teal-600 hover:text-teal-800 transition-colors duration-300 hover:underline"
          >
            Need Help?
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-delayed {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.5s ease-out 0.2s both;
        }
        
        .animate-fade-in-delayed {
          animation: fade-in-delayed 0.8s ease-out 0.4s both;
        }
        
        .animate-bounce {
          animation: bounce 2s infinite;
        }
        
        .backdrop-blur-20 {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>
    </main>
  );
}