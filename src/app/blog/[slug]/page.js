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
        {/* Background with gradient overlay */}
        <div className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 relative">
          
          {/* Glass Morphism Header */}
          <header className="sticky top-0 z-50 bg-white/25 backdrop-blur-[20px] border-b border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
              <Link href="/" className="transition-transform duration-300 hover:scale-105">
                <img src="/findtrusted-logo.png" alt="FindTrustedCleaners Logo" className="w-32 h-auto" />
              </Link>
              <nav className="hidden md:flex space-x-8 text-sm font-medium">
                <Link href="/blog" className="text-teal-800 hover:text-teal-600 transition-all duration-300 hover:scale-105 font-semibold">
                  ← Back to Blog
                </Link>
              </nav>
            </div>
          </header>

          {/* 404 Content */}
          <main className="max-w-4xl mx-auto p-6 py-20">
            <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-12 text-center">
              <div className="text-8xl mb-6">🔍</div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-4">
                Post Not Found
              </h1>
              <p className="text-gray-700 text-lg mb-8">
                The blog post you&apos;re looking for doesn&apos;t exist or may have been moved.
              </p>
              <Link 
                href="/blog"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-y-[-2px] hover:scale-105"
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

  // Calculate reading time (rough estimate: 200 words per minute)
  const wordCount = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <>
      {/* Background with gradient overlay */}
      <div className="min-h-screen bg-gradient-to-br from-teal-900/20 to-teal-700/10 relative">
        
        {/* Glass Morphism Header */}
        <header className="sticky top-0 z-50 bg-white/25 backdrop-blur-[20px] border-b border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
            <Link href="/" className="transition-transform duration-300 hover:scale-105">
              <img src="/findtrusted-logo.png" alt="FindTrustedCleaners Logo" className="w-32 h-auto" />
            </Link>
            <nav className="hidden md:flex space-x-8 text-sm font-medium">
              <Link href="/blog" className="text-teal-800 hover:text-teal-600 transition-all duration-300 hover:scale-105 font-semibold">
                ← Back to Blog
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto p-6 py-12">
          
          {/* Hero Section */}
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-8 mb-8 animate-[fadeIn_0.8s_ease-out]">
            
            {/* Article Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent mb-6 leading-tight">
                {post.title}
              </h1>
              
              {/* Meta Information */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                  <span className="text-teal-600">📅</span>
                  <span className="text-gray-700 font-medium">
                    {new Date(post.createdAt).toLocaleDateString('en-GB', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                  <span className="text-blue-600">⏱️</span>
                  <span className="text-gray-700 font-medium">
                    {readingTime} min read
                  </span>
                </div>
                
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                  <span className="text-green-600">📝</span>
                  <span className="text-gray-700 font-medium">
                    {wordCount.toLocaleString()} words
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <article className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-8 mb-8 animate-[slideUp_0.5s_ease-out]">
            <div 
              className="prose prose-lg max-w-none
                prose-headings:text-teal-800 prose-headings:font-bold
                prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8
                prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-6 prose-h2:border-b prose-h2:border-teal-200 prose-h2:pb-2
                prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-5 prose-h3:text-teal-700
                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                prose-a:text-teal-600 prose-a:font-semibold hover:prose-a:text-teal-800 prose-a:transition-colors prose-a:duration-300
                prose-strong:text-teal-800 prose-strong:font-semibold
                prose-em:text-gray-600 prose-em:italic
                prose-ul:space-y-2 prose-ol:space-y-2
                prose-li:text-gray-700 prose-li:leading-relaxed
                prose-blockquote:border-l-4 prose-blockquote:border-teal-500 prose-blockquote:bg-teal-50/50 prose-blockquote:backdrop-blur-sm prose-blockquote:rounded-r-lg prose-blockquote:p-4 prose-blockquote:my-6 prose-blockquote:text-teal-900 prose-blockquote:font-medium
                prose-code:bg-teal-100/50 prose-code:text-teal-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                prose-pre:bg-gray-800 prose-pre:text-white prose-pre:rounded-xl prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:border prose-pre:border-gray-700
                prose-img:rounded-xl prose-img:shadow-lg prose-img:border prose-img:border-white/30
                prose-table:border-collapse prose-table:border prose-table:border-gray-300 prose-table:rounded-lg prose-table:overflow-hidden
                prose-th:bg-teal-500 prose-th:text-white prose-th:font-semibold prose-th:p-3 prose-th:text-left
                prose-td:border prose-td:border-gray-200 prose-td:p-3 prose-td:text-gray-700
                prose-hr:border-teal-200 prose-hr:my-8"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>

          {/* Article Footer */}
          <div className="bg-white/25 backdrop-blur-[20px] border border-white/20 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-8 mb-8">
            
            {/* Share Section */}
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-teal-800 mb-4">Share this article</h3>
              <div className="flex justify-center gap-4">
                <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-full hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </button>
                <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-full hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-full hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-center">
              <Link 
                href="/blog"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-y-[-2px] hover:scale-105"
              >
                <span>📚</span>
                Read More Articles
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* Custom Animation Keyframes */}
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
      `}</style>
    </>
  );
}