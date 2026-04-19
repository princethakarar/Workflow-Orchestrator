import rateLimit from "express-rate-limit"

/**
 * Rate limiter for team invitation endpoints
 * Limits: 10 requests per hour per IP
 */
export const inviteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: {
        success: false,
        message: "Too many invitation requests. Please try again later."
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Skip successful requests that don't actually send invites (e.g., duplicate emails)
    skipSuccessfulRequests: false,
    // Skip failed requests
    skipFailedRequests: true
})

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        message: "Too many requests. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false
})
