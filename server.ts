import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/config/db.js';
import authRoutes from './server/routes/authRoutes.js';
import employeeRoutes from './server/routes/employeeRoutes.js';
import attendanceRoutes from './server/routes/attendanceRoutes.js';
import leaveRoutes from './server/routes/leaveRoutes.js';
import announcementRoutes from './server/routes/announcementRoutes.js';
import trainingRoutes from './server/routes/trainingRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Initialize DB (supports native MongoDB or memory fallback)
  await connectDB();

  app.use(cors());
  app.use(express.json());

  // Mount API endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/leaves', leaveRoutes);
  app.use('/api/announcements', announcementRoutes);
  app.use('/api/training', trainingRoutes);

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      system: 'StaffSync HRMS Platform',
      timestamp: new Date().toISOString(),
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StaffSync Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
