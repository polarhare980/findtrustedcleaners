import { connectToDatabase } from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import Link from 'next/link';

export const dynamic = 'force-dynamic'; // Ensures fresh data on every request

export default async function BlogPostPage({ params }) {
  const { slug } = params;

  await connectToDatabase();
  const post = await BlogPost.findOne({ slug });

  if (!post) {
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

          <main className="max-w-4xl mx-auto p-6 py-20">
            <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-md p-12 text-center">
              <div className="text-8xl mb-6">🔍</div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-4">
                Post Not Found
              </h1>
              <p className="text-gray-700 text-lg mb-8">
                The blog post you&apos;re looking for doesn&apos;t exist or may have been moved.
              </p>
              <Link 
                href="/blog"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105"
              >
                <span>📚</span>
                Browse All Posts
              </Link>
            </div>
          </main>
        </div>
      </>
    );
  }

  const wordCount = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

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
              className="prose prose-lg max-w-none prose-headings:text-teal-800 prose-headings:font-bold prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8 prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-6 prose-h2:border-b prose-h2:border-teal-200 prose-h2:pb-2 prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-5 prose-h3:text-teal-700 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-a:text-teal-600 prose-a:font-semibold hover:prose-a:text-teal-800 prose-a:transition-colors prose-a:duration-300 prose-strong:text-teal-800 prose-strong:font-semibold prose-em:text-gray-600 prose-em:italic prose-ul:space-y-2 prose-ol:space-y-2 prose-li:text-gray-700 prose-li:leading-relaxed prose-blockquote:border-l-4 prose-blockquote:border-teal-500 prose-blockquote:bg-teal-50/50 prose-blockquote:backdrop-blur-sm prose-blockquote:rounded-r-lg prose-blockquote:p-4 prose-blockquote:my-6 prose-blockquote:text-teal-900 prose-blockquote:font-medium prose-code:bg-teal-100/50 prose-code:text-teal-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-pre:bg-gray-800 prose-pre:text-white prose-pre:rounded-xl prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:border prose-pre:border-gray-700 prose-img:rounded-xl prose-img:shadow-lg prose-img:border prose-img:border-white/30 prose-table:border-collapse prose-table:border prose-table:border-gray-300 prose-table:rounded-lg prose-table:overflow-hidden prose-th:bg-teal-500 prose-th:text-white prose-th:font-semibold prose-th:p-3 prose-th:text-left prose-td:border prose-td:border-gray-200 prose-td:p-3 prose-td:text-gray-700 prose-hr:border-teal-200 prose-hr:my-8"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>

          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-md p-8 mb-8 text-center">
            <h3 className="text-xl font-semibold text-teal-800 mb-4">Share this article</h3>
            <div className="flex justify-center gap-4 mb-8">
              {/* Placeholder share buttons - can replace with actual links or sharing logic */}
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

      {/* Animation Keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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

// Reusable Meta badge
function Meta({ icon, text }) {
  return (
    <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
      <span>{icon}</span>
      <span className="text-gray-700 font-medium">{text}</span>
    </div>
  );
}

// Reusable social button (color = 'blue' | 'indigo' | 'green')
function SocialButton({ color }) {
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
}
