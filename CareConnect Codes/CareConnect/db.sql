DROP DATABASE IF EXISTS careconnect_db;
CREATE DATABASE careconnect_db;
USE careconnect_db;

-- 1. USERS
CREATE TABLE users (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    full_name           VARCHAR(100)  NOT NULL,
    email               VARCHAR(100)  NOT NULL UNIQUE,
    password_hash       VARCHAR(255)  NOT NULL,
    role                ENUM('donor','volunteer','ngo','admin') NOT NULL,
    org_name            VARCHAR(150)  DEFAULT NULL,
    reset_token         VARCHAR(255)  DEFAULT NULL,
    reset_token_expires DATETIME      DEFAULT NULL,
    created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. NGO
CREATE TABLE ngo (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    ngo_name       VARCHAR(150) NOT NULL,
    reg_number     VARCHAR(50) NOT NULL,
    ngo_type       ENUM('NGO','INGO','CBO','SOCIAL_ENTERPRISE','FOUNDATION') NOT NULL,
    focus_area     ENUM('Education','Health','Environment','Disaster Relief','Women & Gender','Youth Development','Livelihood') NOT NULL,
    district       VARCHAR(50) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email          VARCHAR(100) NOT NULL,
    phone          VARCHAR(20) DEFAULT NULL,
    description    TEXT DEFAULT NULL,
    verified       TINYINT(1) DEFAULT 0,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. CAUSE
CREATE TABLE cause (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    ngo_id        INT NOT NULL,
    title         VARCHAR(200) NOT NULL,
    description   TEXT DEFAULT NULL,
    goal_amount   DECIMAL(12,2) NOT NULL,
    raised_amount DECIMAL(12,2) DEFAULT 0.00,
    status        ENUM('active','completed','paused') DEFAULT 'active',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ngo_id) REFERENCES ngo(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. DONATION
CREATE TABLE donation (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    cause_id       INT NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    currency       VARCHAR(10) DEFAULT 'NPR',
    frequency      ENUM('one_time','monthly','yearly') DEFAULT 'one_time',
    payment_status ENUM('pending','completed','failed') DEFAULT 'pending',
    transaction_id VARCHAR(255) DEFAULT NULL,
    donated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cause_id) REFERENCES cause(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. ITEM_DONATION
CREATE TABLE item_donation (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL,
    cause_id          INT NOT NULL,
    items_description TEXT NOT NULL,
    meetup_location   VARCHAR(200) NOT NULL,
    meetup_time       DATETIME NOT NULL,
    phone             VARCHAR(20) NOT NULL,
    status            ENUM('pending','confirmed','completed') DEFAULT 'pending',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cause_id) REFERENCES cause(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. VOLUNTEER
CREATE TABLE volunteer (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    phone        VARCHAR(20) DEFAULT NULL,
    district     VARCHAR(50) DEFAULT NULL,
    availability ENUM('Weekends only','Weekdays only','Flexible','Full-time') DEFAULT NULL,
    skills       VARCHAR(500) DEFAULT NULL,
    status       ENUM('pending','approved','rejected') DEFAULT 'pending',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. VOLUNTEER_APPLICATION
CREATE TABLE volunteer_application (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    volunteer_id INT NOT NULL,
    ngo_id       INT NOT NULL,
    opportunity  VARCHAR(200) NOT NULL,
    status       ENUM('applied','accepted','rejected','completed') DEFAULT 'applied',
    applied_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES volunteer(id) ON DELETE CASCADE,
    FOREIGN KEY (ngo_id) REFERENCES ngo(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. CONTACT_MESSAGE
CREATE TABLE contact_message (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    topic        VARCHAR(100) NOT NULL,
    first_name   VARCHAR(50) NOT NULL,
    last_name    VARCHAR(50) NOT NULL,
    email        VARCHAR(100) NOT NULL,
    phone        VARCHAR(20) DEFAULT NULL,
    role         VARCHAR(50) DEFAULT NULL,
    message      TEXT NOT NULL,
    newsletter   TINYINT(1) DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;



USE careconnect_db;
SET SQL_SAFE_UPDATES = 0;

-- ── 1. `cause` table: columns needed for NGO-posted campaigns ──
ALTER TABLE cause ADD COLUMN IF NOT EXISTS category VARCHAR(60) NULL;
ALTER TABLE cause ADD COLUMN IF NOT EXISTS district VARCHAR(60) NULL;
ALTER TABLE cause ADD COLUMN IF NOT EXISTS accepts_cash TINYINT(1) DEFAULT 1;
ALTER TABLE cause ADD COLUMN IF NOT EXISTS accepts_items TINYINT(1) DEFAULT 1;
ALTER TABLE cause ADD COLUMN IF NOT EXISTS volunteers_needed INT DEFAULT 0;

UPDATE cause SET category = 'Education'      WHERE title = 'Education for All Children' AND (category IS NULL OR category = '');
UPDATE cause SET category = 'Health'         WHERE title = 'Clean Water Initiative'      AND (category IS NULL OR category = '');
UPDATE cause SET category = 'Women & Gender' WHERE title = 'Women Empowerment Program'   AND (category IS NULL OR category = '');
UPDATE cause SET category = 'Disaster Relief'WHERE title = 'Disaster Relief Fund'        AND (category IS NULL OR category = '');
UPDATE cause SET category = 'Health'         WHERE title = 'Mental Health Awareness'     AND (category IS NULL OR category = '');


ALTER TABLE volunteer_application MODIFY COLUMN ngo_id INT NULL;
ALTER TABLE volunteer_application ADD COLUMN IF NOT EXISTS cause_id INT NULL;
ALTER TABLE volunteer_application ADD COLUMN IF NOT EXISTS availability VARCHAR(50) NULL;
ALTER TABLE volunteer_application ADD COLUMN IF NOT EXISTS message TEXT NULL;

SET SQL_SAFE_UPDATES = 0;
UPDATE ngo SET verified = 1;
SET SQL_SAFE_UPDATES = 1;
INSERT INTO users (full_name, email, password_hash, role, org_name)
SELECT 'Admin User', 'admin@careconnect.com',
       '$2y$10$yuVTMBD07sw7AcVO37XxdOaZLNXqkPRJpUs8JsgZEjwlf9iNP1XN2',
       'admin', NULL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@careconnect.com');

SELECT id, ngo_name, verified FROM ngo;
SET SQL_SAFE_UPDATES = 1;

USE careconnect_db;
SET SQL_SAFE_UPDATES = 0;

-- ── Nepal Health Initiative ──
INSERT INTO users (full_name, email, password_hash, role, org_name)
SELECT 'Maya Gurung', 'contact@nepalhealthinitiative.org',
       '$2b$10$R8BMy5X.703XDpjRk2I9nuMAe5EOW4Fem//x2Ou9DYLD3Ql1PiiLy', 'ngo', 'Nepal Health Initiative'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'contact@nepalhealthinitiative.org');

INSERT INTO ngo (user_id, ngo_name, reg_number, ngo_type, focus_area, district, contact_person, email, phone, description, verified)
SELECT id, 'Nepal Health Initiative', 'NGO-2026-0002', 'NGO', 'Health', 'Lalitpur', 'Maya Gurung', email, '+977-9810000000',
       'Mobile health camp pioneer delivering free checkups, medicines, and maternal healthcare to underserved communities across 10+ districts.', 1
FROM users WHERE email = 'contact@nepalhealthinitiative.org'
AND NOT EXISTS (SELECT 1 FROM ngo WHERE ngo_name = 'Nepal Health Initiative');

INSERT INTO cause (ngo_id, title, description, goal_amount, raised_amount, status)
SELECT id, 'Mobile Health Camps', 'Mobile health camp pioneer delivering free checkups, medicines, and maternal healthcare to underserved communities across 10+ districts.', 900000, 520000, 'active'
FROM ngo WHERE ngo_name = 'Nepal Health Initiative'
AND id NOT IN (SELECT ngo_id FROM cause WHERE ngo_id IS NOT NULL);

-- ── Green Nepal ──
INSERT INTO users (full_name, email, password_hash, role, org_name)
SELECT 'Bikash Shrestha', 'contact@greennepal.org',
       '$2b$10$R8BMy5X.703XDpjRk2I9nuMAe5EOW4Fem//x2Ou9DYLD3Ql1PiiLy', 'ngo', 'Green Nepal'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'contact@greennepal.org');

INSERT INTO ngo (user_id, ngo_name, reg_number, ngo_type, focus_area, district, contact_person, email, phone, description, verified)
SELECT id, 'Green Nepal', 'NGO-2026-0003', 'NGO', 'Environment', 'Kathmandu', 'Bikash Shrestha', email, '+977-9810000001',
       'Environmental conservation organization running tree plantation drives, river clean-ups, and climate change awareness programs across Nepal''s urban centers.', 1
FROM users WHERE email = 'contact@greennepal.org'
AND NOT EXISTS (SELECT 1 FROM ngo WHERE ngo_name = 'Green Nepal');

INSERT INTO cause (ngo_id, title, description, goal_amount, raised_amount, status)
SELECT id, 'Tree Plantation & River Clean-ups', 'Environmental conservation organization running tree plantation drives, river clean-ups, and climate change awareness programs.', 500000, 210000, 'active'
FROM ngo WHERE ngo_name = 'Green Nepal'
AND id NOT IN (SELECT ngo_id FROM cause WHERE ngo_id IS NOT NULL);

-- ── Rebuild Nepal ──
INSERT INTO users (full_name, email, password_hash, role, org_name)
SELECT 'Dipesh Karki', 'contact@rebuildnepal.org',
       '$2b$10$R8BMy5X.703XDpjRk2I9nuMAe5EOW4Fem//x2Ou9DYLD3Ql1PiiLy', 'ngo', 'Rebuild Nepal'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'contact@rebuildnepal.org');

INSERT INTO ngo (user_id, ngo_name, reg_number, ngo_type, focus_area, district, contact_person, email, phone, description, verified)
SELECT id, 'Rebuild Nepal', 'NGO-2026-0004', 'NGO', 'Disaster Relief', 'Bhaktapur', 'Dipesh Karki', email, '+977-9810000002',
       'Specializing in rapid disaster response, post-disaster rehabilitation, and building community resilience against earthquakes, floods, and landslides.', 1
FROM users WHERE email = 'contact@rebuildnepal.org'
AND NOT EXISTS (SELECT 1 FROM ngo WHERE ngo_name = 'Rebuild Nepal');

INSERT INTO cause (ngo_id, title, description, goal_amount, raised_amount, status)
SELECT id, 'Disaster Response & Rehabilitation', 'Rapid disaster response, post-disaster rehabilitation, and building community resilience against earthquakes, floods, and landslides.', 2500000, 1520000, 'active'
FROM ngo WHERE ngo_name = 'Rebuild Nepal'
AND id NOT IN (SELECT ngo_id FROM cause WHERE ngo_id IS NOT NULL);

-- ── WomenRise Nepal ──
INSERT INTO users (full_name, email, password_hash, role, org_name)
SELECT 'Anita Tamang', 'contact@womenrisenepal.org',
       '$2b$10$R8BMy5X.703XDpjRk2I9nuMAe5EOW4Fem//x2Ou9DYLD3Ql1PiiLy', 'ngo', 'WomenRise Nepal'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'contact@womenrisenepal.org');

INSERT INTO ngo (user_id, ngo_name, reg_number, ngo_type, focus_area, district, contact_person, email, phone, description, verified)
SELECT id, 'WomenRise Nepal', 'NGO-2026-0005', 'NGO', 'Women & Gender', 'Lalitpur', 'Anita Tamang', email, '+977-9810000003',
       'Empowers rural women through digital literacy, micro-finance, and vocational training programs. Advocates for gender equality and women''s rights.', 1
FROM users WHERE email = 'contact@womenrisenepal.org'
AND NOT EXISTS (SELECT 1 FROM ngo WHERE ngo_name = 'WomenRise Nepal');

INSERT INTO cause (ngo_id, title, description, goal_amount, raised_amount, status)
SELECT id, 'Digital Literacy & Micro-Finance for Women', 'Empowers rural women through digital literacy, micro-finance, and vocational training programs.', 800000, 370000, 'active'
FROM ngo WHERE ngo_name = 'WomenRise Nepal'
AND id NOT IN (SELECT ngo_id FROM cause WHERE ngo_id IS NOT NULL);

-- ── Youth4Change ──
INSERT INTO users (full_name, email, password_hash, role, org_name)
SELECT 'Suman Lama', 'contact@youth4change.org',
       '$2b$10$R8BMy5X.703XDpjRk2I9nuMAe5EOW4Fem//x2Ou9DYLD3Ql1PiiLy', 'ngo', 'Youth4Change'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'contact@youth4change.org');

INSERT INTO ngo (user_id, ngo_name, reg_number, ngo_type, focus_area, district, contact_person, email, phone, description, verified)
SELECT id, 'Youth4Change', 'NGO-2026-0006', 'NGO', 'Youth Development', 'Kathmandu', 'Suman Lama', email, '+977-9810000004',
       'Youth-led organization working on street children rehabilitation, mentorship programs, and civic engagement for Nepal''s next generation of leaders.', 1
FROM users WHERE email = 'contact@youth4change.org'
AND NOT EXISTS (SELECT 1 FROM ngo WHERE ngo_name = 'Youth4Change');

INSERT INTO cause (ngo_id, title, description, goal_amount, raised_amount, status)
SELECT id, 'Street Children Mentorship Program', 'Street children rehabilitation, mentorship programs, and civic engagement for Nepal''s next generation of leaders.', 400000, 180000, 'active'
FROM ngo WHERE ngo_name = 'Youth4Change'
AND id NOT IN (SELECT ngo_id FROM cause WHERE ngo_id IS NOT NULL);

SET SQL_SAFE_UPDATES = 1;