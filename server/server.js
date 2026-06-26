import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import leadRoutes from './routes/leadRoutes.js';
import dealRoutes from './routes/dealRoutes.js';
import docRoutes from './routes/docRoutes.js';
import tenderRoutes from './routes/tenderRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { clerkMiddleware } from '@clerk/express';

dotenv.config();
connectDB();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: process.env.NODE_ENV === 'production' ? 100 : 10000
});
app.use('/api/', limiter);

app.use(cors({ 
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true 
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(clerkMiddleware());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/deals', dealRoutes);
app.use('/api/v1/docs', docRoutes);
app.use('/api/v1/tenders', tenderRoutes);

app.get('/', (req, res) => {
  res.json({ message: "CRM API is running successfully!" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
