import { middleware as authMiddleware } from './src/lib/middleware';

export const config = {
  matcher: [
    '/clients/:path*',
    '/dashboard/:path*',
    '/cleaners/edit/:path*', // protect only edit/dashboard
    '/cleaners/dashboard/:path*',
  ],
};


export default authMiddleware;
