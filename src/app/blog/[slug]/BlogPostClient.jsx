'use client';

import Link from 'next/link';
import React, { useEffect } from 'react';

export default function BlogPostClient({ post, readingTime, wordCount }) {
  const Meta = ({ icon, text }) => (
    <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
      <span>{icon}</span>
      <span className="text-gray-700 font-medium">{text}</span>
    </div>
  );

  const SocialButton = ({ color }) => {
    const gradients = {
      blue: 'from-blue-500 to-blue-600',
      indigo: 'from-blue-600 to-blue-700',
      green: 'from-green-500 to-green-600',
    };
    return (
      <button
        className={`bg-gradient-to-r ${gradients[color]} text-white p-3 rounded-full hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl`}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </button>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 relative">
        <header className="sticky top-0 z-50 bg-white/25 backdrop-blur-[20px] border-b border-white/20 shadow-md">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
            <Link href="/" className="transition-transform duration-300 hover:scale-105">
              <img src="/findtrusted-logo.png" alt="FindTrustedCleaners Logo" className="w-32 h-auto" />
            </Link>
            <nav className="hidden md:flex space-x-8 text-sm font-medium">
              <Link href="/blog" className="text-teal-800 hover:text-teal-600 font-semibold transition-all duration-300 hover:scale-105">
                ← Back to Blog
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6 py-12">
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-md p-8 mb-8 animate-fadeIn">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-6 leading-tight">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <Meta icon="📅" text={new Date(post.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })} />
                <Meta icon="⏱️" text={`${readingTime} min read`} />
                <Meta icon="📝" text={`${wordCount.toLocaleString()} words`} />
              </div>
            </div>
          </div>

          <article className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-md p-8 mb-8 animate-slideUp">
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>

          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-md p-8 mb-8 text-center">
            <h3 className="text-xl font-semibold text-teal-800 mb-4">Share this article</h3>
            <div className="flex justify-center gap-4 mb-8">
              <SocialButton color="blue" />
              <SocialButton color="indigo" />
              <SocialButton color="green" />
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105"
            >
              <span>📚</span>
              Read More Articles
            </Link>
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out both;
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out both;
        }
      `}</style>
    </>
  );
}
