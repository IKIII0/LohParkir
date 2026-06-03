-- =============================================================
-- LohParkir — Database Seed (Minimal)
-- Simple seed dengan data dasar untuk testing
-- =============================================================

-- Insert admin user
INSERT INTO users (role, nama, email, password_hash, is_active, created_at, updated_at)
VALUES 
    ('superadmin', 'Super Administrator', 'superadmin@lohparkir.id', '$2b$12$LK7y9QqGhJ3vhKFm8N.J7OuvzGZp5xR6VXFJzV5uNK1EJOBQTXFZi', TRUE, NOW(), NOW()),
    ('admin', 'Admin User 1', 'admin@lohparkir.id', '$2b$12$LK7y9QqGhJ3vhKFm8N.J7OuvzGZp5xR6VXFJzV5uNK1EJOBQTXFZi', TRUE, NOW(), NOW()),
    ('public', 'Public User', 'user@lohparkir.id', '$2b$12$LK7y9QqGhJ3vhKFm8N.J7OuvzGZp5xR6VXFJzV5uNK1EJOBQTXFZi', TRUE, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert parking zones
INSERT INTO parking_zones (nama, alamat, koordinat, kota, tarif_motor, tarif_mobil, is_active, created_at, updated_at)
VALUES
    ('Zona A - Pusat', 'Jl. Pusat', POINT(3.5896, 98.6731), 'Medan', 2000, 5000, TRUE, NOW(), NOW()),
    ('Zona B - Utara', 'Jl. Utara', POINT(3.60, 98.67), 'Medan', 2000, 5000, TRUE, NOW(), NOW()),
    ('Zona C - Selatan', 'Jl. Selatan', POINT(3.57, 98.67), 'Medan', 2000, 5000, TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
