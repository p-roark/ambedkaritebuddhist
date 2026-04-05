-- Admin seed for Ambedkarite Buddhist Community
-- Default password: admin123  (change immediately in production!)
-- Regenerate the hash if you change the password:
--   node -e "const b=require('bcryptjs'); b.hash('yourpassword',12).then(console.log)"

INSERT OR IGNORE INTO User (id, name, email, passwordHash, role, emailVerified, createdAt, updatedAt)
VALUES (
  'admin-001',
  'Admin User',
  'pankaj9um@gmail.com',
  '$2b$12$2bnVSXtl6AuIv9peg0lmMOB95/cwGXmIQYtzUtexlr8qDlBW9GkZW',
  'ADMIN',
  datetime('now'),
  datetime('now'),
  datetime('now')
);

INSERT OR IGNORE INTO ReferralCode (id, code, ownerId, maxUses, currentUses, active, createdAt)
VALUES (
  'ref-admin-001',
  'BHIM-ABC-7K2M',
  'admin-001',
  50,
  0,
  1,
  datetime('now')
);
