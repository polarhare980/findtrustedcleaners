import { middleware as authMiddleware } from './src/lib/middleware';

export const config = {
  matcher: ['/clients/:path*', '/cleaners/:path*', '/dashboard/:path*'],
};

export default authMiddleware;
