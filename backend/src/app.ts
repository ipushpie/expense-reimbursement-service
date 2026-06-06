import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorMiddleware, notFoundMiddleware } from './shared/middleware/error.middleware';

import { authRouter } from './modules/auth/auth.routes';
import { expenseRouter } from './modules/expenses/expense.routes';
import { reimbursementRouter } from './modules/reimbursements/reimbursement.routes';
import { departmentRouter } from './modules/departments/department.routes';
import { auditRouter } from './modules/audit/audit.routes';

const app = express();

// ── Trust proxy (for correct IP behind Caddy/Nginx) ────────────────────────
app.set('trust proxy', 1);

// ── Security headers via Helmet ─────────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  }),
);

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ── Body parsing & compression ──────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// ── Rate limiters ────────────────────────────────────────────────────────────
// Global: broad protection against scraping / DoS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many requests, please try again later', code: 'RATE_LIMITED' } },
});

// Auth: strict brute-force protection on login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
  message: { success: false, error: { message: 'Too many authentication attempts. Try again in 15 minutes.', code: 'AUTH_RATE_LIMITED' } },
});

// Write operations: protect mutations
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many write requests', code: 'WRITE_RATE_LIMITED' } },
});

// File uploads: separate, more conservative limit
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { message: 'Upload limit reached for this hour', code: 'UPLOAD_RATE_LIMITED' } },
  keyGenerator: (req) => req.user?.userId ?? req.ip ?? 'anonymous',
});

app.use(globalLimiter);

// ── Health check (unauthenticated, no rate limit overhead) ──────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/reimbursements', writeLimiter, reimbursementRouter);
app.use('/api/departments', departmentRouter);
app.use('/api/audit-logs', auditRouter);

// Attach upload limiter specifically on attachment upload endpoints
app.use('/api/expenses/:id/attachments', uploadLimiter);

// ── 404 & global error handler (must be last) ────────────────────────────────
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };
