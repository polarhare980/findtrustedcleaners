import Image from "next/image";
import Link from "next/link";
import AdSlot from "@/components/ads/AdSlot";

const FALLBACK_HERO = "/og-image.jpg";

function safeDate(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

function formatDate(value) {
  const d = safeDate(value);
  if (!d) return "Editorial guide";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function cleanText(value = "") {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function readingMinutes(post = {}) {
  const text = cleanText(post.content || post.excerpt || post.description || post.title || "");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function formatReadTime(value, fallbackMinutes = 1) {
  if (typeof value === "string" && value.trim()) {
    return value.toLowerCase().includes("read") ? value.trim() : `${value.trim()} min read`;
  }

  const n = Number(value || fallbackMinutes);
  return `${Math.max(1, Math.round(Number.isFinite(n) ? n : fallbackMinutes))} min read`;
}

function categoryFromPost(post = {}) {
  const firstTag = Array.isArray(post.tags) && post.tags.length ? post.tags[0] : null;
  return post.category || firstTag || "Home Life";
}

function getHeroImage(post = {}) {
  return post.coverImage || post.heroImage || post.image || FALLBACK_HERO;
}

function normaliseStringList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cleanText(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => cleanText(item))
      .filter(Boolean);
  }

  return [];
}

function EditorialAdBlock({ slot, minHeight = 120 }) {
  if (!slot && process.env.NODE_ENV === "production") return null;

  return (
    <aside className="not-prose my-10 overflow-hidden rounded-[28px] border border-stone-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(244,237,226,0.82))] p-4 shadow-[0_20px_60px_rgba(82,64,42,0.08)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
        <span>Sponsor break</span>
        <span className="h-px flex-1 bg-stone-200" aria-hidden="true" />
      </div>
      <AdSlot
        slot={slot}
        className="overflow-hidden rounded-2xl border border-white/70 bg-white/70 shadow-sm"
        style={{ minHeight }}
      />
    </aside>
  );
}

function renderHtmlWithAdMarkers(html = "", slots = {}) {
  const tokenRe = /<!--\s*AD:([a-z0-9_-]+)\s*-->/gi;
  const nodes = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = tokenRe.exec(String(html || ""))) !== null) {
    const before = html.slice(lastIndex, match.index);
    if (before.trim()) {
      nodes.push(<div key={`html-${key++}`} dangerouslySetInnerHTML={{ __html: before }} />);
    }

    const token = String(match[1] || "").toLowerCase();
    const slot =
      token === "in1" || token === "in-article-1"
        ? slots.in1
        : token === "in2" || token === "in-article-2"
          ? slots.in2
          : token === "sidebar"
            ? slots.sidebar
            : token === "top"
              ? slots.top
              : token === "bottom"
                ? slots.bottom
                : null;

    nodes.push(<EditorialAdBlock key={`ad-${key++}`} slot={slot} />);
    lastIndex = tokenRe.lastIndex;
  }

  const rest = html.slice(lastIndex);
  if (rest.trim()) {
    nodes.push(<div key={`html-${key++}`} dangerouslySetInnerHTML={{ __html: rest }} />);
  }

  return nodes;
}

function ReadNextRail({ posts = [] }) {
  const items = Array.isArray(posts) ? posts.filter(Boolean).slice(0, 8) : [];
  if (!items.length) return null;

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-700">Read next</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">More from the magazine</h2>
        </div>
        <Link href="/blog" className="hidden text-sm font-semibold text-stone-600 transition hover:text-teal-700 sm:inline-flex">
          See all
        </Link>
      </div>

      <div className="flex snap-x gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, index) => {
          const slug = String(item.slug || "").replace(/^\/?blog\//, "").replace(/^\//, "");
          const image = getHeroImage(item);
          return (
            <Link
              key={item._id || slug || item.title || index}
              href={`/blog/${slug}`}
              className="group min-w-[78%] snap-start overflow-hidden rounded-[28px] border border-white/80 bg-white/86 shadow-[0_18px_50px_rgba(82,64,42,0.10)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(82,64,42,0.16)] sm:min-w-[320px]"
            >
              <div className="relative h-44 bg-stone-200">
                <Image
                  src={image}
                  alt={item.imageAlt || item.title || "Article image"}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 78vw, 320px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              </div>
              <div className="p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-700">
                  {categoryFromPost(item)}
                </p>
                <h3 className="mt-2 line-clamp-3 text-lg font-semibold leading-snug text-stone-950">
                  {item.title || "Read the next guide"}
                </h3>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">
                  {cleanText(item.excerpt || item.description || "A practical home guide from FindTrustedCleaners.")}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function MagazineArticleLayout({ post = {}, slots = {}, readNextPosts = [], contentHtml = "", children }) {
  const heroImage = getHeroImage(post);
  const title = post.title || "FindTrustedCleaners Magazine";
  const excerpt = cleanText(post.excerpt || post.description || post.metaDescription || "Practical, calm advice for choosing cleaners and caring for your home.");
  const category = categoryFromPost(post);
  const dateLabel = formatDate(post.publishedAt || post.createdAt || post.updatedAt);
  const readTimeLabel = formatReadTime(post.readTime || post.readingTime, readingMinutes(post));
  const takeaways = normaliseStringList(post.takeaways);
  const pullQuote = cleanText(post.pullQuote || "");
  const bodyText = cleanText(contentHtml || post.content || "");
  const shouldShowStandfirst = Boolean(excerpt) && !bodyText.toLowerCase().startsWith(excerpt.toLowerCase());
  const shouldShowPullQuote = Boolean(pullQuote) && !bodyText.toLowerCase().includes(pullQuote.toLowerCase());

  return (
    <main className="min-h-screen bg-[#f5f0e8] text-stone-950">
      <section className="relative min-h-[74vh] overflow-hidden bg-stone-900 sm:min-h-[78vh]">
        <Image
          src={heroImage}
          alt={post.imageAlt || post.coverImageAlt || title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.34)_42%,rgba(0,0,0,0.76)_100%)]" />
        <div className="relative z-10 mx-auto flex min-h-[74vh] max-w-7xl flex-col justify-end px-4 pb-10 pt-28 text-white sm:min-h-[78vh] sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <Link href="/blog" className="mb-8 inline-flex rounded-full border border-white/25 bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/90 backdrop-blur-md transition hover:bg-white/20">
              Magazine
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/78">{category}</p>
            <h1 className="mt-4 text-[clamp(2.65rem,11vw,6.4rem)] font-semibold leading-[0.92] tracking-[-0.075em] text-white drop-shadow-sm">
              {title}
            </h1>
            {excerpt ? (
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/86 sm:text-2xl sm:leading-9">
                {excerpt}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200/80 bg-[#fbf7ef]/95">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-4 py-5 text-sm text-stone-600 sm:px-6 lg:px-8">
          <span className="rounded-full border border-stone-200 bg-white/70 px-4 py-2">{dateLabel}</span>
          <span className="rounded-full border border-stone-200 bg-white/70 px-4 py-2">{readTimeLabel}</span>
          <span className="rounded-full border border-stone-200 bg-white/70 px-4 py-2">By Find Trusted Cleaners</span>
        </div>
      </section>

      {slots.top ? (
        <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8">
          <EditorialAdBlock slot={slots.top} minHeight={90} />
        </div>
      ) : null}

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,760px)_320px] lg:px-8 lg:py-16">
        <article className="min-w-0">
          {takeaways.length > 0 ? (
            <div className="mb-8 rounded-[30px] border border-stone-200/80 bg-white/72 p-6 shadow-[0_20px_70px_rgba(82,64,42,0.08)] backdrop-blur sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-teal-700">Key takeaways</p>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-stone-700 sm:text-base">
                {takeaways.slice(0, 4).map((item) => (
                  <li key={item} className="flex gap-3 rounded-2xl bg-[#f5f0e8]/80 p-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {shouldShowPullQuote ? (
            <blockquote className="mb-10 rounded-[30px] border border-stone-200/80 bg-white/62 px-7 py-8 text-3xl font-medium leading-tight tracking-[-0.035em] text-stone-700 shadow-[0_20px_70px_rgba(82,64,42,0.08)] sm:text-4xl">
              {pullQuote}
            </blockquote>
          ) : null}

          <div className="magazine-prose prose prose-lg max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-stone-950 prose-h2:mt-14 prose-h2:text-3xl prose-h2:leading-tight prose-h3:mt-10 prose-h3:text-2xl prose-p:text-stone-700 prose-p:leading-8 prose-a:text-teal-700 prose-a:underline prose-a:decoration-teal-200 prose-a:underline-offset-4 hover:prose-a:text-teal-900 prose-strong:text-stone-950 prose-img:my-10 prose-img:rounded-[28px] prose-img:shadow-[0_24px_80px_rgba(82,64,42,0.14)] prose-blockquote:my-12 prose-blockquote:border-0 prose-blockquote:px-0 prose-blockquote:text-3xl prose-blockquote:font-medium prose-blockquote:leading-tight prose-blockquote:tracking-[-0.035em] prose-blockquote:text-stone-700 prose-blockquote:not-italic sm:prose-blockquote:text-4xl">
            {shouldShowStandfirst ? (
              <div className="mb-8 text-xl leading-9 text-stone-700 first-letter:float-left first-letter:mr-3 first-letter:text-7xl first-letter:font-serif first-letter:leading-[0.8] first-letter:text-stone-400">
                {excerpt}
              </div>
            ) : null}
            {children || renderHtmlWithAdMarkers(contentHtml, slots)}
          </div>

          {slots.bottom ? <EditorialAdBlock slot={slots.bottom} /> : null}
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {slots.sidebar ? <EditorialAdBlock slot={slots.sidebar} minHeight={520} /> : null}

            <div className="overflow-hidden rounded-[30px] border border-white/80 bg-white/78 shadow-[0_20px_60px_rgba(82,64,42,0.08)] backdrop-blur">
              <div className="relative h-52 bg-stone-200">
                <Image src={heroImage} alt="Magazine feature" fill className="object-cover" sizes="320px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80">Editor note</p>
                  <p className="mt-1 text-lg font-semibold leading-snug">Designed to feel useful, calm and easy to read.</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm leading-7 text-stone-600">
                  Compare local cleaner profiles, check availability and make a clearer choice without the usual directory noise.
                </p>
                <Link href="/cleaners" className="mt-5 inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(15,118,110,0.22)] transition hover:bg-teal-800">
                  Find a cleaner
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <ReadNextRail posts={readNextPosts} />
    </main>
  );
}
