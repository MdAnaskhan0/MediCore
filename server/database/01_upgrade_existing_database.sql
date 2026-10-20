-- =====================================================================
-- MediCore: upgrade an EXISTING hospital_db to the latest version.
--   * patient portal      (patient_accounts table, appointments.source)
--   * managed home page   (portal_slides, portal_gallery, doctor photo/popular,
--                          service portal visibility)
-- Safe to run more than once. Does NOT delete or change your current data.
-- If this fixes "hospital_db.patient_accounts doesn't exist", you are done.
-- =====================================================================
USE hospital_db;

CREATE TABLE IF NOT EXISTS patient_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);
CREATE TABLE IF NOT EXISTS portal_slides (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(150) NOT NULL, subtitle VARCHAR(255), image_url VARCHAR(500), button_text VARCHAR(50), button_link VARCHAR(255), sort_order INT NOT NULL DEFAULT 0, status VARCHAR(20) NOT NULL DEFAULT 'Active');
CREATE TABLE IF NOT EXISTS portal_gallery (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(150), image_url VARCHAR(500) NOT NULL, category VARCHAR(60), sort_order INT NOT NULL DEFAULT 0, status VARCHAR(20) NOT NULL DEFAULT 'Active');

-- add missing columns (works on MySQL and MariaDB)
SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND COLUMN_NAME = 'source');
SET @s = IF(@c = 0, "ALTER TABLE appointments ADD COLUMN source VARCHAR(20) DEFAULT 'Staff'", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'doctors' AND COLUMN_NAME = 'photo_url');
SET @s = IF(@c = 0, "ALTER TABLE doctors ADD COLUMN photo_url VARCHAR(500)", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'doctors' AND COLUMN_NAME = 'qualification');
SET @s = IF(@c = 0, "ALTER TABLE doctors ADD COLUMN qualification VARCHAR(150)", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'doctors' AND COLUMN_NAME = 'experience_years');
SET @s = IF(@c = 0, "ALTER TABLE doctors ADD COLUMN experience_years INT", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'doctors' AND COLUMN_NAME = 'bio');
SET @s = IF(@c = 0, "ALTER TABLE doctors ADD COLUMN bio VARCHAR(500)", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'doctors' AND COLUMN_NAME = 'popular');
SET @s = IF(@c = 0, "ALTER TABLE doctors ADD COLUMN popular VARCHAR(3) NOT NULL DEFAULT 'No'", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services' AND COLUMN_NAME = 'description');
SET @s = IF(@c = 0, "ALTER TABLE services ADD COLUMN description VARCHAR(255)", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SET @c = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services' AND COLUMN_NAME = 'show_on_portal');
SET @s = IF(@c = 0, "ALTER TABLE services ADD COLUMN show_on_portal VARCHAR(3) NOT NULL DEFAULT 'Yes'", 'SELECT 1');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- starter slides and gallery, only when those tables are still empty
INSERT INTO portal_slides (title, subtitle, image_url, button_text, button_link, sort_order, status)
SELECT * FROM (SELECT
 'Care that starts with a simple booking' a, 'Pick your doctor, choose a free time, and we will confirm your visit. No account needed.' b, '/uploads/samples/slide-1.svg' c, 'Book an appointment' d, '/portal/book' e, 1 f, 'Active' g
 UNION ALL SELECT 'Diagnostics under one roof','Pathology, radiology and ECG, with results in your patient account as soon as they are ready.','/uploads/samples/slide-2.svg','See services and prices','/portal#services',2,'Active'
 UNION ALL SELECT 'Your health history, always with you','Create a free patient account to follow appointments, test reports and bills.','/uploads/samples/slide-3.svg','Create my account','/portal/register',3,'Active') s
WHERE NOT EXISTS (SELECT 1 FROM portal_slides);

INSERT INTO portal_gallery (title, category, image_url, sort_order, status)
SELECT * FROM (SELECT 'Reception and waiting area' a, 'Facilities' b, '/uploads/samples/reception.svg' c, 1 d, 'Active' e
 UNION ALL SELECT 'Emergency ward','Facilities','/uploads/samples/emergency.svg',2,'Active'
 UNION ALL SELECT 'Pathology laboratory','Diagnostics','/uploads/samples/laboratory.svg',3,'Active'
 UNION ALL SELECT 'Radiology and imaging','Diagnostics','/uploads/samples/imaging.svg',4,'Active'
 UNION ALL SELECT 'In-house pharmacy','Facilities','/uploads/samples/pharmacy.svg',5,'Active'
 UNION ALL SELECT 'Private patient rooms','Facilities','/uploads/samples/rooms.svg',6,'Active') g
WHERE NOT EXISTS (SELECT 1 FROM portal_gallery);

-- Next: in the admin panel, open Doctor information and set "Show as popular on portal" = Yes
-- for the doctors you want on the home page.
