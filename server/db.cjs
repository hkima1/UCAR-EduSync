/**
 * UCAR Database — SQLite schema, migrations & seed data
 * Uses better-sqlite3 for synchronous, fast local DB.
 */
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'ucar.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    migrate(db);
  }
  return db;
}

function migrate(db) {
  // ── Create tables ──────────────────────────────────────────────

  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      role_name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS institutions (
      id TEXT PRIMARY KEY,
      institution_name TEXT NOT NULL,
      location TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      google_id TEXT UNIQUE,
      password_hash TEXT,
      telephone TEXT,
      institution_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      email_verified INTEGER DEFAULT 1,
      approval_status TEXT DEFAULT 'pending' CHECK(approval_status IN ('pending','approved','rejected')),
      approved_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (institution_id) REFERENCES institutions(id),
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS profile_categories (
      id TEXT PRIMARY KEY,
      category_name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      profile_category_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (profile_category_id) REFERENCES profile_categories(id)
    );

    CREATE TABLE IF NOT EXISTS security_logs (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      user_id TEXT,
      ip_address TEXT,
      status TEXT NOT NULL,
      details TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );
  `);

  // ── Live migration: add google_id column if it doesn't exist yet ──────────
  const cols = db.pragma('table_info(users)').map(c => c.name);
  if (!cols.includes('google_id')) {
    db.exec(`ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;`);
    console.log('✓ Migrated: added google_id column to users');
  }
  // ── Seed data ──────────────────────────────────────────────────

  const roleCount = db.prepare('SELECT COUNT(*) as c FROM roles').get().c;
  if (roleCount === 0) {
    const insertRole = db.prepare('INSERT INTO roles (id, role_name) VALUES (?, ?)');
    const roles = [
      { id: uuidv4(), name: 'student' },
      { id: uuidv4(), name: 'teacher' },
      { id: uuidv4(), name: 'institution_admin' },
      { id: uuidv4(), name: 'director' },
      { id: uuidv4(), name: 'ucar_admin' },
    ];
    const insertMany = db.transaction((items) => {
      for (const r of items) insertRole.run(r.id, r.name);
    });
    insertMany(roles);
    console.log('✓ Seeded roles');
  }

  const instCount = db.prepare('SELECT COUNT(*) as c FROM institutions').get().c;
  if (instCount === 0) {
    const insertInst = db.prepare('INSERT INTO institutions (id, institution_name, location) VALUES (?, ?, ?)');
    const institutions = [
      { id: uuidv4(), name: 'ENIT', location: 'Tunis' },
      { id: uuidv4(), name: 'INSAT', location: 'Tunis' },
      { id: uuidv4(), name: 'IHEC Carthage', location: 'Carthage' },
      { id: uuidv4(), name: 'ESSTT', location: 'Tunis' },
      { id: uuidv4(), name: 'FST', location: 'Tunis' },
      { id: uuidv4(), name: 'ISBST', location: 'Tunis' },
      { id: uuidv4(), name: 'ENAU', location: 'Tunis' },
      { id: uuidv4(), name: 'ISBM', location: 'Bardo' },
      { id: uuidv4(), name: 'Université de Carthage (UCAR)', location: 'Tunis' },
    ];
    const insertMany = db.transaction((items) => {
      for (const inst of items) insertInst.run(inst.id, inst.name, inst.location);
    });
    insertMany(institutions);
    console.log('✓ Seeded institutions');
  }

  const catCount = db.prepare('SELECT COUNT(*) as c FROM profile_categories').get().c;
  if (catCount === 0) {
    const insertCat = db.prepare('INSERT INTO profile_categories (id, category_name) VALUES (?, ?)');
    const categories = [
      { id: uuidv4(), name: 'staff' },
      { id: uuidv4(), name: 'student' },
    ];
    const insertMany = db.transaction((items) => {
      for (const c of items) insertCat.run(c.id, c.name);
    });
    insertMany(categories);
    console.log('✓ Seeded profile categories');
  }

  // Seed a default UCAR admin so the system can be bootstrapped
  const adminCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (adminCount === 0) {
    const ucarAdminRole = db.prepare("SELECT id FROM roles WHERE role_name = 'ucar_admin'").get();
    const ucarInst = db.prepare("SELECT id FROM institutions WHERE institution_name LIKE '%UCAR%'").get();

    if (ucarAdminRole && ucarInst) {
      const adminId = uuidv4();
      const passwordHash = bcrypt.hashSync('Admin@2025', 10);
      db.prepare(`
        INSERT INTO users (id, username, nom, prenom, email, password_hash, telephone, institution_id, role_id, email_verified, approval_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'approved')
      `).run(adminId, 'solaymen.tlili', 'Tlili', 'Solaymen', 'solaymen.tlili@enstab.ucar.tn', passwordHash, '', ucarInst.id, ucarAdminRole.id);

      // Create profile for admin
      const staffCat = db.prepare("SELECT id FROM profile_categories WHERE category_name = 'staff'").get();
      if (staffCat) {
        db.prepare('INSERT INTO profiles (id, user_id, nom, prenom, profile_category_id) VALUES (?, ?, ?, ?, ?)')
          .run(uuidv4(), adminId, 'Marzouki', 'Faouzi', staffCat.id);
      }
      console.log('✓ Seeded default UCAR admin (solaymen.tlili@enstab.ucar.tn)');
    }
  }

  // Seed mock security logs for Grafana monitoring
  const logCount = db.prepare('SELECT COUNT(*) as c FROM security_logs').get().c;
  if (logCount === 0) {
    const insertLog = db.prepare("INSERT INTO security_logs (id, event_type, user_id, ip_address, status, details, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))");
    
    // Generate some mock logs spread over the last 24 hours
    const logs = [];
    const eventTypes = ['login_attempt', 'fraud_alert', 'unauthorized_access', 'password_reset', 'data_export'];
    
    for (let i = 0; i < 50; i++) {
      const isFraud = Math.random() > 0.8;
      const type = isFraud ? 'fraud_alert' : eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const status = (type === 'fraud_alert' || type === 'unauthorized_access' || Math.random() > 0.8) ? 'failed' : 'success';
      const timeOffset = `-${Math.floor(Math.random() * 24)} hours`;
      
      logs.push({
        id: uuidv4(),
        event_type: type,
        user_id: `user-${Math.floor(Math.random() * 100)}`,
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        status: status,
        details: isFraud ? 'Suspicious multiple login attempts detected' : 'Standard operation',
        timeOffset: timeOffset
      });
    }

    const insertMany = db.transaction((items) => {
      for (const log of items) insertLog.run(log.id, log.event_type, log.user_id, log.ip_address, log.status, log.details, log.timeOffset);
    });
    insertMany(logs);
    console.log('✓ Seeded mock security logs for Grafana monitoring');
  }
}

module.exports = { getDb };
