import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

const app = express();

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CORS_ORIGIN || '').split(',').map((x) => x.trim()).filter(Boolean);
    if (!origin || allowed.length === 0 || allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Restaurant Reservation API is healthy',
    data: { uptime: process.uptime() }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/reservations', reservationRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
