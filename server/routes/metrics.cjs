const express = require('express');
const router = express.Router();
const client = require('prom-client');
const { getDb } = require('../db.cjs');

// Create a Registry
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'ucar-edusync-api'
});

// Enable the collection of default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

const dbFraudAlerts = new client.Gauge({
  name: 'ucar_db_fraud_alerts_total',
  help: 'Total number of fraudulent activities in DB',
});
register.registerMetric(dbFraudAlerts);

const dbLoginAttempts = new client.Gauge({
  name: 'ucar_db_login_attempts_total',
  help: 'Total number of login attempts in DB',
  labelNames: ['status']
});
register.registerMetric(dbLoginAttempts);

const dbActiveUsers = new client.Gauge({
  name: 'ucar_db_active_users_total',
  help: 'Total number of registered users in DB'
});
register.registerMetric(dbActiveUsers);

const dbUnauthorizedAccess = new client.Gauge({
  name: 'ucar_db_unauthorized_access_total',
  help: 'Total number of unauthorized access attempts in DB'
});
register.registerMetric(dbUnauthorizedAccess);

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    
    // Users count
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    dbActiveUsers.set(userCount);

    // Fraud alerts
    const fraudCount = db.prepare("SELECT COUNT(*) as count FROM security_logs WHERE event_type = 'fraud_alert'").get().count;
    dbFraudAlerts.set(fraudCount);

    // Unauthorized access
    const unauthCount = db.prepare("SELECT COUNT(*) as count FROM security_logs WHERE event_type = 'unauthorized_access'").get().count;
    dbUnauthorizedAccess.set(unauthCount);

    // Login attempts by status
    const loginSuccess = db.prepare("SELECT COUNT(*) as count FROM security_logs WHERE event_type = 'login_attempt' AND status = 'success'").get().count;
    const loginFailed = db.prepare("SELECT COUNT(*) as count FROM security_logs WHERE event_type = 'login_attempt' AND status = 'failed'").get().count;
    
    dbLoginAttempts.set({ status: 'success' }, loginSuccess);
    dbLoginAttempts.set({ status: 'failed' }, loginFailed);

    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  } catch (ex) {
    res.status(500).send(ex.message);
  }
});

module.exports = router;
