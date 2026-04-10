import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';

export default function DashboardShell({ children, ctaHref = '/login', ctaLabel = 'Login' }) {
  return (
    <div className="site-shell">
      <PublicHeader ctaHref={ctaHref} ctaLabel={ctaLabel} />
      <main className="section-shell py-10 sm:py-12">{children}</main>
      <PublicFooter />
    </div>
  );
}
