-- ================================================================
-- database/schema.sql — Complete PostgreSQL Schema
-- Run this to set up the database from scratch.
-- Author: Digital Kaam Naka Dev Team
-- ================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABLE 1: users
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    phone               VARCHAR(15) UNIQUE NOT NULL,
    email               VARCHAR(100) UNIQUE,
    password            VARCHAR(255),
    role                VARCHAR(20) NOT NULL CHECK (role IN ('worker', 'employer', 'admin')),
    language            VARCHAR(20) DEFAULT 'mr',
    profile_photo       VARCHAR(255),
    is_verified         BOOLEAN DEFAULT false,
    is_active           BOOLEAN DEFAULT true,
    otp                 VARCHAR(6),
    otp_expires         TIMESTAMP,
    otp_attempts        INTEGER DEFAULT 0,
    otp_blocked_until   TIMESTAMP,
    last_login          TIMESTAMP,
    fcm_token           VARCHAR(500),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ================================================================
-- TABLE 2: workers
-- ================================================================
CREATE TABLE IF NOT EXISTS workers (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    aadhar_number   VARCHAR(20),
    aadhar_photo    VARCHAR(255),
    daily_rate      DECIMAL(10,2) NOT NULL,
    experience_yrs  INTEGER DEFAULT 0,
    bio             TEXT,
    total_jobs      INTEGER DEFAULT 0,
    avg_rating      DECIMAL(3,2) DEFAULT 0.00,
    total_earnings  DECIMAL(12,2) DEFAULT 0.00,
    is_available    BOOLEAN DEFAULT false,
    is_verified     BOOLEAN DEFAULT false,
    latitude        DECIMAL(10,8),
    longitude       DECIMAL(11,8),
    address         TEXT,
    city            VARCHAR(100),
    taluka          VARCHAR(100),
    district        VARCHAR(100),
    state           VARCHAR(50) DEFAULT 'Maharashtra',
    pincode         VARCHAR(10),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workers_is_available ON workers(is_available);
CREATE INDEX idx_workers_district ON workers(district);
CREATE INDEX idx_workers_lat_lng ON workers(latitude, longitude);
CREATE INDEX idx_workers_avg_rating ON workers(avg_rating DESC);

-- ================================================================
-- TABLE 3: employers
-- ================================================================
CREATE TABLE IF NOT EXISTS employers (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    company_name    VARCHAR(200),
    employer_type   VARCHAR(20) DEFAULT 'individual' CHECK (employer_type IN ('individual','contractor','farmer','business')),
    gst_number      VARCHAR(20),
    avg_rating      DECIMAL(3,2) DEFAULT 0.00,
    total_posts     INTEGER DEFAULT 0,
    total_hires     INTEGER DEFAULT 0,
    total_spent     DECIMAL(12,2) DEFAULT 0.00,
    address         TEXT,
    city            VARCHAR(100),
    district        VARCHAR(100),
    state           VARCHAR(50) DEFAULT 'Maharashtra',
    pincode         VARCHAR(10),
    latitude        DECIMAL(10,8),
    longitude       DECIMAL(11,8),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- TABLE 4: categories
-- ================================================================
CREATE TABLE IF NOT EXISTS categories (
    id              SERIAL PRIMARY KEY,
    name_en         VARCHAR(100) NOT NULL,
    name_mr         VARCHAR(100) NOT NULL,
    name_hi         VARCHAR(100) NOT NULL,
    name_gu         VARCHAR(100),
    icon_url        VARCHAR(255),
    icon_emoji      VARCHAR(10),
    description_mr  TEXT,
    sort_order      INTEGER DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- TABLE 5: worker_skills
-- ================================================================
CREATE TABLE IF NOT EXISTS worker_skills (
    id              SERIAL PRIMARY KEY,
    worker_id       INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    category_id     INTEGER REFERENCES categories(id),
    level           VARCHAR(20) DEFAULT 'beginner' CHECK (level IN ('beginner','experienced','expert')),
    years_in_skill  INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(worker_id, category_id)
);

-- ================================================================
-- TABLE 6: availability
-- ================================================================
CREATE TABLE IF NOT EXISTS availability (
    id                          SERIAL PRIMARY KEY,
    worker_id                   INTEGER REFERENCES workers(id) ON DELETE CASCADE,
    date                        DATE NOT NULL,
    is_available                BOOLEAN DEFAULT true,
    start_time                  TIME DEFAULT '06:00:00',
    end_time                    TIME DEFAULT '20:00:00',
    latitude                    DECIMAL(10,8),
    longitude                   DECIMAL(11,8),
    radius_km                   INTEGER DEFAULT 20,
    available_for_categories    INTEGER[] DEFAULT '{}',
    note                        VARCHAR(200),
    created_at                  TIMESTAMP DEFAULT NOW(),
    UNIQUE(worker_id, date)
);

CREATE INDEX idx_availability_date ON availability(date, is_available);

-- ================================================================
-- TABLE 7: job_posts
-- ================================================================
CREATE TABLE IF NOT EXISTS job_posts (
    id              SERIAL PRIMARY KEY,
    employer_id     INTEGER REFERENCES employers(id) ON DELETE CASCADE,
    category_id     INTEGER REFERENCES categories(id),
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    workers_needed  INTEGER DEFAULT 1,
    workers_booked  INTEGER DEFAULT 0,
    daily_rate      DECIMAL(10,2) NOT NULL,
    job_date        DATE NOT NULL,
    end_date        DATE,
    duration_days   INTEGER DEFAULT 1,
    job_type        VARCHAR(20) DEFAULT 'daily' CHECK (job_type IN ('daily','weekly','monthly')),
    latitude        DECIMAL(10,8),
    longitude       DECIMAL(11,8),
    address         TEXT,
    city            VARCHAR(100),
    district        VARCHAR(100),
    state           VARCHAR(50) DEFAULT 'Maharashtra',
    pincode         VARCHAR(10),
    is_urgent       BOOLEAN DEFAULT false,
    status          VARCHAR(30) DEFAULT 'open',
    views_count     INTEGER DEFAULT 0,
    site_photos     TEXT[] DEFAULT '{}',
    requirements    TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON job_posts(status);
CREATE INDEX idx_jobs_district ON job_posts(district);
CREATE INDEX idx_jobs_date ON job_posts(job_date);
CREATE INDEX idx_jobs_urgent ON job_posts(is_urgent);
CREATE INDEX idx_jobs_lat_lng ON job_posts(latitude, longitude);

-- ================================================================
-- TABLE 8: bookings
-- ================================================================
CREATE TABLE IF NOT EXISTS bookings (
    id                  SERIAL PRIMARY KEY,
    job_post_id         INTEGER REFERENCES job_posts(id),
    worker_id           INTEGER REFERENCES workers(id),
    employer_id         INTEGER REFERENCES employers(id),
    status              VARCHAR(20) DEFAULT 'pending',
    start_date          DATE NOT NULL,
    end_date            DATE,
    total_days          INTEGER DEFAULT 1,
    agreed_rate         DECIMAL(10,2) NOT NULL,
    total_amount        DECIMAL(10,2) NOT NULL,
    work_started_at     TIMESTAMP,
    work_ended_at       TIMESTAMP,
    work_site_latitude  DECIMAL(10,8),
    work_site_longitude DECIMAL(11,8),
    cancel_reason       TEXT,
    cancelled_by        INTEGER REFERENCES users(id),
    cancelled_at        TIMESTAMP,
    completion_photos   TEXT[] DEFAULT '{}',
    booking_note        TEXT,
    rating_given_to_worker   BOOLEAN DEFAULT false,
    rating_given_to_employer BOOLEAN DEFAULT false,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bookings_worker ON bookings(worker_id, status);
CREATE INDEX idx_bookings_employer ON bookings(employer_id, status);

-- ================================================================
-- TABLE 9: payments
-- ================================================================
CREATE TABLE IF NOT EXISTS payments (
    id                      SERIAL PRIMARY KEY,
    booking_id              INTEGER REFERENCES bookings(id) UNIQUE,
    employer_id             INTEGER REFERENCES employers(id),
    worker_id               INTEGER REFERENCES workers(id),
    amount                  DECIMAL(10,2) NOT NULL,
    platform_fee            DECIMAL(10,2) DEFAULT 0,
    worker_amount           DECIMAL(10,2),
    method                  VARCHAR(20) DEFAULT 'cash',
    status                  VARCHAR(20) DEFAULT 'pending',
    razorpay_order_id       VARCHAR(200),
    razorpay_payment_id     VARCHAR(200),
    razorpay_signature      VARCHAR(500),
    transaction_id          VARCHAR(200),
    paid_at                 TIMESTAMP,
    refund_reason           TEXT,
    refunded_at             TIMESTAMP,
    created_at              TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- TABLE 10: ratings
-- ================================================================
CREATE TABLE IF NOT EXISTS ratings (
    id              SERIAL PRIMARY KEY,
    booking_id      INTEGER REFERENCES bookings(id),
    rated_by        INTEGER REFERENCES users(id),
    rated_to        INTEGER REFERENCES users(id),
    role_rated_to   VARCHAR(20) CHECK (role_rated_to IN ('worker','employer')),
    score           INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
    review          TEXT,
    is_visible      BOOLEAN DEFAULT true,
    is_flagged      BOOLEAN DEFAULT false,
    flag_reason     VARCHAR(200),
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(booking_id, rated_by, rated_to)
);

CREATE INDEX idx_ratings_rated_to ON ratings(rated_to, role_rated_to, is_visible);

-- ================================================================
-- TABLE 11: notifications
-- ================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,
    title_mr        VARCHAR(200),
    title_hi        VARCHAR(200),
    title_en        VARCHAR(200),
    message_mr      TEXT,
    message_hi      TEXT,
    message_en      TEXT,
    reference_id    INTEGER,
    reference_type  VARCHAR(50),
    channel         VARCHAR(20) DEFAULT 'app',
    is_read         BOOLEAN DEFAULT false,
    read_at         TIMESTAMP,
    is_delivered    BOOLEAN DEFAULT false,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ================================================================
-- TABLE 12: subscriptions
-- ================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id              SERIAL PRIMARY KEY,
    employer_id     INTEGER REFERENCES employers(id),
    plan            VARCHAR(20) NOT NULL,
    price           DECIMAL(10,2) NOT NULL,
    posts_allowed   INTEGER NOT NULL,
    posts_used      INTEGER DEFAULT 0,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    razorpay_sub_id VARCHAR(200),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- TABLE 13: locations
-- ================================================================
CREATE TABLE IF NOT EXISTS locations (
    id          SERIAL PRIMARY KEY,
    state       VARCHAR(100) DEFAULT 'Maharashtra',
    district    VARCHAR(100) NOT NULL,
    taluka      VARCHAR(100),
    city        VARCHAR(100),
    pincode     VARCHAR(10),
    latitude    DECIMAL(10,8),
    longitude   DECIMAL(11,8),
    is_active   BOOLEAN DEFAULT true
);

CREATE INDEX idx_locations_district ON locations(district);
CREATE INDEX idx_locations_pincode ON locations(pincode);

-- ================================================================
-- TABLE 14: disputes
-- ================================================================
CREATE TABLE IF NOT EXISTS disputes (
    id              SERIAL PRIMARY KEY,
    booking_id      INTEGER REFERENCES bookings(id),
    raised_by       INTEGER REFERENCES users(id),
    against         INTEGER REFERENCES users(id),
    reason          TEXT NOT NULL,
    evidence_urls   TEXT[] DEFAULT '{}',
    status          VARCHAR(20) DEFAULT 'open',
    resolution      TEXT,
    resolved_by     INTEGER REFERENCES users(id),
    resolved_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- TABLE 15: admin_logs
-- ================================================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id              SERIAL PRIMARY KEY,
    admin_id        INTEGER REFERENCES users(id),
    action          VARCHAR(200) NOT NULL,
    target_table    VARCHAR(100),
    target_id       INTEGER,
    details         TEXT,
    ip_address      VARCHAR(50),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_action ON admin_logs(action);
