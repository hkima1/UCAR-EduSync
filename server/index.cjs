/**
 * UCAR Backend — Express.js API Server
 * Local SQLite database with JWT authentication
 * 
 * Run: node server/index.cjs
 * Default port: 3001
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.cjs');
const institutionsRoutes = require('./routes/institutions.cjs');
const rolesRoutes = require('./routes/roles.cjs');

const app = express();
const PORT = process.env.API_PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`  ${timestamp}  ${req.method.padEnd(6)} ${req.path}`);
  next();
});

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/institutions', institutionsRoutes);
app.use('/api/roles', rolesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Start ───────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║        UCAR Backend — API Server             ║');
  console.log('  ╠══════════════════════════════════════════════╣');
  console.log(`  ║  🌐  http://localhost:${PORT}                  ║`);
  console.log('  ║  📂  Database: server/ucar.db                ║');
  console.log('  ║  🔑  JWT Auth enabled                        ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('  Default admin: f.marzouki@ucar.tn / Admin@2025');
  console.log('');
});

// Force keep-alive for debugging
setInterval(() => {}, 1000 * 60 * 60);
