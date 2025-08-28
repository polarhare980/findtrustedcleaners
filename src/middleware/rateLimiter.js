import rateLimit from 'next-rate-limit';

export const limiter = rateLimit({
  // Limit to 5 requests per minute per IP
  window: 60 * 1000, // 1 minute
  limit: 5,
  message: 'Too many requests. Please try again later.',
});
