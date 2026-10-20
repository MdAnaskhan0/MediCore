-- =====================================================================
-- MediCore Hospital Management - FULL DATABASE (structure + sample data)
-- Includes the patient portal and the managed home page (slider, popular
-- doctors, services with prices, gallery).
--
-- WARNING: this file DROPS and re-creates every table in hospital_db.
--          Any existing data in those tables is lost. To keep your data,
--          run 01_upgrade_existing_database.sql instead.
-- =====================================================================
CREATE DATABASE IF NOT EXISTS hospital_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS portal_gallery;
DROP TABLE IF EXISTS portal_slides;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS sales_returns;
DROP TABLE IF EXISTS medicine_sales;
DROP TABLE IF EXISTS supplier_payments;
DROP TABLE IF EXISTS purchase_returns;
DROP TABLE IF EXISTS medicine_purchases;
DROP TABLE IF EXISTS medicines;
DROP TABLE IF EXISTS stock_usage;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS refunds;
DROP TABLE IF EXISTS due_collections;
DROP TABLE IF EXISTS report_deliveries;
DROP TABLE IF EXISTS investigations;
DROP TABLE IF EXISTS discount_requests;
DROP TABLE IF EXISTS service_orders;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS patient_accounts;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS doctor_payments;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS auditors;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;


CREATE TABLE roles (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(80) NOT NULL UNIQUE, permissions TEXT, description VARCHAR(255));
CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(150) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, role_id INT NOT NULL, status VARCHAR(20) DEFAULT 'Active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (role_id) REFERENCES roles(id));
CREATE TABLE employees (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, designation VARCHAR(100), department VARCHAR(100), phone VARCHAR(30), salary DECIMAL(12,2) NOT NULL DEFAULT 0, join_date DATE, status VARCHAR(20) DEFAULT 'Active');
CREATE TABLE auditors (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(150), phone VARCHAR(30), status VARCHAR(20) DEFAULT 'Active');

CREATE TABLE doctors (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, specialization VARCHAR(120), phone VARCHAR(30), email VARCHAR(150), fee DECIMAL(12,2) NOT NULL DEFAULT 0, commission_percent DECIMAL(5,2) NOT NULL DEFAULT 0, status VARCHAR(20) DEFAULT 'Active', photo_url VARCHAR(500), qualification VARCHAR(150), experience_years INT, bio VARCHAR(500), popular VARCHAR(3) NOT NULL DEFAULT 'No');
CREATE TABLE doctor_payments (id INT AUTO_INCREMENT PRIMARY KEY, doctor_id INT NOT NULL, amount DECIMAL(12,2) NOT NULL, method VARCHAR(30), paid_on DATE NOT NULL, note VARCHAR(255), FOREIGN KEY (doctor_id) REFERENCES doctors(id));

CREATE TABLE patients (id INT AUTO_INCREMENT PRIMARY KEY, patient_code VARCHAR(30) NOT NULL UNIQUE, name VARCHAR(120) NOT NULL, age INT, gender VARCHAR(15), phone VARCHAR(30), blood_group VARCHAR(5), address VARCHAR(255));
CREATE TABLE appointments (id INT AUTO_INCREMENT PRIMARY KEY, patient_id INT NOT NULL, doctor_id INT NOT NULL, appointment_date DATE NOT NULL, appointment_time TIME, status VARCHAR(20) DEFAULT 'Scheduled', note VARCHAR(255), source VARCHAR(20) DEFAULT 'Staff', FOREIGN KEY (patient_id) REFERENCES patients(id), FOREIGN KEY (doctor_id) REFERENCES doctors(id));
CREATE TABLE patient_accounts (id INT AUTO_INCREMENT PRIMARY KEY, patient_id INT NOT NULL UNIQUE, email VARCHAR(150) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (patient_id) REFERENCES patients(id));
CREATE TABLE services (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, category VARCHAR(50), price DECIMAL(12,2) NOT NULL DEFAULT 0, description VARCHAR(255), show_on_portal VARCHAR(3) NOT NULL DEFAULT 'Yes');
CREATE TABLE service_orders (
  id INT AUTO_INCREMENT PRIMARY KEY, patient_id INT NOT NULL, service_id INT NOT NULL, doctor_id INT NULL, order_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0, discount DECIMAL(12,2) NOT NULL DEFAULT 0, paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  collected DECIMAL(12,2) NOT NULL DEFAULT 0, refunded DECIMAL(12,2) NOT NULL DEFAULT 0,
  due DECIMAL(12,2) AS (amount - discount - paid - collected) STORED,
  FOREIGN KEY (patient_id) REFERENCES patients(id), FOREIGN KEY (service_id) REFERENCES services(id), FOREIGN KEY (doctor_id) REFERENCES doctors(id));
CREATE TABLE discount_requests (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, requested_discount DECIMAL(12,2) NOT NULL, reason VARCHAR(255), status VARCHAR(20) DEFAULT 'Pending', FOREIGN KEY (order_id) REFERENCES service_orders(id));
CREATE TABLE investigations (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, test_name VARCHAR(150) NOT NULL, sample_date DATE, result TEXT, status VARCHAR(20) DEFAULT 'Pending', FOREIGN KEY (order_id) REFERENCES service_orders(id));
CREATE TABLE report_deliveries (id INT AUTO_INCREMENT PRIMARY KEY, investigation_id INT NOT NULL, delivered_to VARCHAR(120), delivered_on DATE, status VARCHAR(20) DEFAULT 'Pending', FOREIGN KEY (investigation_id) REFERENCES investigations(id));
CREATE TABLE due_collections (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, amount DECIMAL(12,2) NOT NULL, collected_on DATE NOT NULL, method VARCHAR(30), FOREIGN KEY (order_id) REFERENCES service_orders(id));
CREATE TABLE refunds (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, amount DECIMAL(12,2) NOT NULL, reason VARCHAR(255), refunded_on DATE NOT NULL, FOREIGN KEY (order_id) REFERENCES service_orders(id));

CREATE TABLE suppliers (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, contact_person VARCHAR(120), phone VARCHAR(30), email VARCHAR(150), address VARCHAR(255));
CREATE TABLE units (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(60) NOT NULL UNIQUE, short_name VARCHAR(15));
CREATE TABLE products (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, unit_id INT, stock INT NOT NULL DEFAULT 0, reorder_level INT NOT NULL DEFAULT 0, FOREIGN KEY (unit_id) REFERENCES units(id));
CREATE TABLE purchases (id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, supplier_id INT NOT NULL, qty INT NOT NULL, unit_price DECIMAL(12,2) NOT NULL, total DECIMAL(14,2) AS (qty * unit_price) STORED, purchase_date DATE NOT NULL, FOREIGN KEY (product_id) REFERENCES products(id), FOREIGN KEY (supplier_id) REFERENCES suppliers(id));
CREATE TABLE stock_usage (id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, qty INT NOT NULL, used_by VARCHAR(120), usage_date DATE NOT NULL, note VARCHAR(255), FOREIGN KEY (product_id) REFERENCES products(id));

CREATE TABLE medicines (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, generic_name VARCHAR(150), category VARCHAR(50), unit_id INT, purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0, sale_price DECIMAL(12,2) NOT NULL DEFAULT 0, stock INT NOT NULL DEFAULT 0, reorder_level INT NOT NULL DEFAULT 0, expiry_date DATE, FOREIGN KEY (unit_id) REFERENCES units(id));
CREATE TABLE medicine_purchases (id INT AUTO_INCREMENT PRIMARY KEY, medicine_id INT NOT NULL, supplier_id INT NOT NULL, invoice_no VARCHAR(50), qty INT NOT NULL, unit_cost DECIMAL(12,2) NOT NULL, total DECIMAL(14,2) AS (qty * unit_cost) STORED, purchase_date DATE NOT NULL, FOREIGN KEY (medicine_id) REFERENCES medicines(id), FOREIGN KEY (supplier_id) REFERENCES suppliers(id));
CREATE TABLE purchase_returns (id INT AUTO_INCREMENT PRIMARY KEY, medicine_id INT NOT NULL, supplier_id INT NOT NULL, qty INT NOT NULL, unit_cost DECIMAL(12,2) NOT NULL, total DECIMAL(14,2) AS (qty * unit_cost) STORED, return_date DATE NOT NULL, reason VARCHAR(255), FOREIGN KEY (medicine_id) REFERENCES medicines(id), FOREIGN KEY (supplier_id) REFERENCES suppliers(id));
CREATE TABLE supplier_payments (id INT AUTO_INCREMENT PRIMARY KEY, supplier_id INT NOT NULL, amount DECIMAL(12,2) NOT NULL, method VARCHAR(30), paid_on DATE NOT NULL, note VARCHAR(255), FOREIGN KEY (supplier_id) REFERENCES suppliers(id));
CREATE TABLE medicine_sales (id INT AUTO_INCREMENT PRIMARY KEY, customer_name VARCHAR(120) DEFAULT 'Walk-in', medicine_id INT NOT NULL, qty INT NOT NULL, unit_price DECIMAL(12,2) NOT NULL, total DECIMAL(14,2) AS (qty * unit_price) STORED, sale_date DATE NOT NULL, FOREIGN KEY (medicine_id) REFERENCES medicines(id));
CREATE TABLE sales_returns (id INT AUTO_INCREMENT PRIMARY KEY, medicine_id INT NOT NULL, qty INT NOT NULL, refund_amount DECIMAL(12,2) NOT NULL DEFAULT 0, return_date DATE NOT NULL, reason VARCHAR(255), FOREIGN KEY (medicine_id) REFERENCES medicines(id));
CREATE TABLE expenses (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(150) NOT NULL, category VARCHAR(60), amount DECIMAL(12,2) NOT NULL, expense_date DATE NOT NULL, note VARCHAR(255));

CREATE TABLE portal_slides (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(150) NOT NULL, subtitle VARCHAR(255), image_url VARCHAR(500), button_text VARCHAR(50), button_link VARCHAR(255), sort_order INT NOT NULL DEFAULT 0, status VARCHAR(20) NOT NULL DEFAULT 'Active');
CREATE TABLE portal_gallery (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(150), image_url VARCHAR(500) NOT NULL, category VARCHAR(60), sort_order INT NOT NULL DEFAULT 0, status VARCHAR(20) NOT NULL DEFAULT 'Active');

-- =====================================================================
-- SAMPLE DATA  (dates are relative to the day you import this file)
-- Staff logins   : admin@hospital.com / admin123
--                  reception@hospital.com, pharmacy@hospital.com, accounts@hospital.com / staff123
-- Patient logins : rina@mail.com, karim@mail.com / patient123
-- =====================================================================
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO roles (id, name, permissions, description) VALUES
(1,'Admin','*','Full access to every module'),
(2,'Receptionist','patients,appointments,services,orders,discount-requests,investigations,report-deliveries,due-collections,refunds','Front desk and billing'),
(3,'Pharmacist','medicines,medicine-purchases,medicine-purchase-list,purchase-returns,supplier-payments,medicine-sales,medicine-sales-list,sales-returns,medicine-stock-report,report-medicine,suppliers,units','Pharmacy and medicine stock'),
(4,'Accountant','doctor-payments,supplier-payments,expenses,report-financial,report-income-expense,report-collection,report-due,report-total','Accounts and reports');

INSERT INTO users (id, name, email, password, role_id, status) VALUES
(1,'Administrator','admin@hospital.com','$2a$10$PX98UnUW1xeVI/EkJIuoPO0dE8aNDkz/oMsn6dDozltR8kLM6h64e',1,'Active'),
(2,'Nasrin Sultana','reception@hospital.com','$2a$10$spFmJVkR.lADtEAXfCwxxeG.BwbD11KiUTqLCL5JhI0dDn2z3c.WC',2,'Active'),
(3,'Habib Rahman','pharmacy@hospital.com','$2a$10$spFmJVkR.lADtEAXfCwxxeG.BwbD11KiUTqLCL5JhI0dDn2z3c.WC',3,'Active'),
(4,'Mahmud Hasan','accounts@hospital.com','$2a$10$spFmJVkR.lADtEAXfCwxxeG.BwbD11KiUTqLCL5JhI0dDn2z3c.WC',4,'Active');

INSERT INTO employees (id, name, designation, department, phone, salary, join_date, status) VALUES
(1,'Nasrin Sultana','Receptionist','Front Desk','01711000001',18000,'2023-02-01','Active'),
(2,'Habib Rahman','Pharmacist','Pharmacy','01711000002',25000,'2022-08-15','Active'),
(3,'Shirin Akter','Senior Nurse','Ward','01711000003',30000,'2021-05-10','Active'),
(4,'Jahid Hasan','Lab Technician','Pathology','01711000004',22000,'2023-09-01','Active'),
(5,'Rokeya Begum','Cleaner','Housekeeping','01711000005',12000,'2024-01-20','On leave');

INSERT INTO auditors (id, name, email, phone, status) VALUES
(1,'Kamal Hossain','kamal.audit@example.com','01912000001','Active'),
(2,'Shahnaz Parveen','shahnaz.audit@example.com','01912000002','Active'),
(3,'Delwar Khan','delwar.audit@example.com','01912000003','Inactive');

INSERT INTO doctors (id, name, specialization, phone, email, fee, commission_percent, status, photo_url, qualification, experience_years, bio, popular) VALUES
(1,'Dr. Rahim Chowdhury','Cardiology','01811000001','rahim@hospital.com',800,30,'Active',NULL,'MBBS, MD (Cardiology)',15,'Treats heart rhythm problems, high blood pressure and chest pain, with a focus on prevention.','Yes'),
(2,'Dr. Nusrat Jahan','Gynecology','01811000002','nusrat@hospital.com',700,30,'Active',NULL,'MBBS, FCPS (Gynecology and Obstetrics)',12,'Antenatal care, safe delivery and women''s health.','Yes'),
(3,'Dr. Arif Hossain','General Medicine','01811000003','arif@hospital.com',500,25,'Active',NULL,'MBBS, MD (Internal Medicine)',10,'Fever, diabetes, thyroid and long-term illness care.','Yes'),
(4,'Dr. Sabina Yasmin','Pediatrics','01811000004','sabina@hospital.com',600,28,'Active',NULL,'MBBS, DCH',9,'Child health, vaccination and growth monitoring.','Yes'),
(5,'Dr. Tanvir Ahmed','Orthopedics','01811000005','tanvir@hospital.com',900,35,'Inactive',NULL,'MBBS, MS (Orthopedics)',14,'Bone, joint and sports injuries.','No'),
(6,'Dr. Rahim Uddin','ENT','01811000006','rahim.uddin@hospital.com',650,30,'Active',NULL,'MBBS, DLO',8,'Ear, nose and throat conditions.','No'),
(7,'Dr. Salma Rahman','Dermatology','01811000007','salma@hospital.com',700,30,'Active',NULL,'MBBS, MD (Dermatology)',11,'Skin, hair and nail problems.','No'),
(8,'Dr. Arif Khan','Cardiology','01811000008','arif.khan@hospital.com',850,30,'Active',NULL,'MBBS, MD (Cardiology)',7,'Echocardiography and heart failure care.','No');

INSERT INTO doctor_payments (id, doctor_id, amount, method, paid_on, note) VALUES
(1,1,1200,'Bank transfer',CURDATE() - INTERVAL 20 DAY,'Commission - first half of month'),
(2,2,850,'Cash',CURDATE() - INTERVAL 15 DAY,'Commission'),
(3,3,600,'Mobile banking',CURDATE() - INTERVAL 10 DAY,'Commission'),
(4,4,720,'Cheque',CURDATE() - INTERVAL 6 DAY,'Commission'),
(5,1,900,'Bank transfer',CURDATE() - INTERVAL 2 DAY,'Commission - second half of month');

INSERT INTO patients (id, patient_code, name, age, gender, phone, blood_group, address) VALUES
(1,'PT10000001','Rina Akter',30,'Female','01800000001','B+','House 12, Road 4, Dhanmondi, Dhaka'),
(2,'PT10000002','Karim Uddin',45,'Male','01800000002','O+','Mirpur 10, Dhaka'),
(3,'PT10000003','Sumaiya Khatun',27,'Female','01800000003','A+','Uttara Sector 7, Dhaka'),
(4,'PT10000004','Abdul Mannan',62,'Male','01800000004','AB+','Narayanganj'),
(5,'PT10000005','Farzana Islam',35,'Female','01800000005','O-','Gazipur'),
(6,'PT10000006','Tanvir Hasan',8,'Male','01800000006','A-','Mohammadpur, Dhaka');

INSERT INTO patient_accounts (id, patient_id, email, password) VALUES
(1,1,'rina@mail.com','$2a$10$qk6NF4Co9cdXz4wovcgqLO96eQ/nZGcjrMwN4NxkEUsm85CHS9SWC'),
(2,2,'karim@mail.com','$2a$10$qk6NF4Co9cdXz4wovcgqLO96eQ/nZGcjrMwN4NxkEUsm85CHS9SWC');

INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, status, note, source) VALUES
(1,1,1,CURDATE() + INTERVAL 1 DAY,'10:00:00','Requested','Chest discomfort when climbing stairs','Portal'),
(2,2,3,CURDATE() + INTERVAL 1 DAY,'11:30:00','Scheduled','Fever for three days','Portal'),
(3,3,2,CURDATE() + INTERVAL 2 DAY,'09:30:00','Scheduled','Routine check-up','Staff'),
(4,6,4,CURDATE() + INTERVAL 2 DAY,'10:00:00','Requested','Cough and cold','Guest'),
(5,4,1,CURDATE(),'16:30:00','Scheduled','Blood pressure follow-up','Staff'),
(6,5,3,CURDATE() - INTERVAL 3 DAY,'10:30:00','Completed','Back pain','Staff'),
(7,1,1,CURDATE() - INTERVAL 10 DAY,'09:00:00','Completed','Palpitations','Staff'),
(8,2,3,CURDATE() - INTERVAL 7 DAY,'12:00:00','Cancelled','Patient could not attend','Portal');

INSERT INTO services (id, name, category, price, description, show_on_portal) VALUES
(1,'General Consultation','Consultation',500,'Visit with a general physician','Yes'),
(2,'Complete Blood Count (CBC)','Pathology',600,'Blood count test, report on the same day','Yes'),
(3,'Chest X-Ray','Radiology',800,'Digital X-ray, PA view','Yes'),
(4,'ECG','Procedure',400,'Resting 12-lead ECG','Yes'),
(5,'Ultrasonography (Whole Abdomen)','Radiology',1500,'Liver, kidneys, bladder and more','Yes'),
(6,'Fasting Blood Sugar','Pathology',250,'Requires 8 hours of fasting','Yes'),
(7,'Dressing / Minor Procedure','Procedure',350,'Wound dressing and minor procedures','No'),
(8,'Specialist Consultation','Consultation',800,'Visit with a specialist doctor','Yes');

-- due is calculated by MySQL: amount - discount - paid - collected
INSERT INTO service_orders (id, patient_id, service_id, doctor_id, order_date, amount, discount, paid, collected, refunded) VALUES
(1,1,8,1,CURDATE() - INTERVAL 10 DAY,800,0,800,0,0),
(2,2,2,3,CURDATE() - INTERVAL 6 DAY,600,50,300,250,0),
(3,3,3,2,CURDATE() - INTERVAL 4 DAY,800,0,400,0,100),
(4,4,4,1,CURDATE() - INTERVAL 3 DAY,400,0,400,0,400),
(5,5,5,3,CURDATE() - INTERVAL 2 DAY,1500,100,800,600,0),
(6,1,2,1,CURDATE() - INTERVAL 1 DAY,600,0,200,100,0);

INSERT INTO discount_requests (id, order_id, requested_discount, reason, status) VALUES
(1,2,50,'Senior citizen discount','Approved'),
(2,5,100,'Staff relative','Approved'),
(3,3,100,'Financial hardship','Pending'),
(4,6,50,'Requested at the counter','Rejected');

INSERT INTO investigations (id, order_id, test_name, sample_date, result, status) VALUES
(1,2,'Complete Blood Count (CBC)',CURDATE() - INTERVAL 6 DAY,'Hb 12.8 g/dL, WBC 7,200/cumm, Platelets 250,000/cumm. All within normal range.','Completed'),
(2,3,'Chest X-Ray (PA view)',CURDATE() - INTERVAL 4 DAY,NULL,'In progress'),
(3,5,'Ultrasonography - Whole Abdomen',CURDATE() - INTERVAL 2 DAY,'Liver, gall bladder, kidneys and uterus appear normal. No free fluid.','Completed'),
(4,6,'Complete Blood Count (CBC)',CURDATE() - INTERVAL 1 DAY,NULL,'Pending'),
(5,2,'Fasting Blood Sugar',CURDATE() - INTERVAL 6 DAY,'5.4 mmol/L (normal).','Completed');

INSERT INTO report_deliveries (id, investigation_id, delivered_to, delivered_on, status) VALUES
(1,1,'Karim Uddin',CURDATE() - INTERVAL 5 DAY,'Delivered'),
(2,3,'Farzana Islam',CURDATE() - INTERVAL 1 DAY,'Delivered'),
(3,5,'Karim Uddin',NULL,'Pending');

INSERT INTO due_collections (id, order_id, amount, collected_on, method) VALUES
(1,2,250,CURDATE() - INTERVAL 5 DAY,'Cash'),
(2,5,600,CURDATE() - INTERVAL 1 DAY,'Mobile banking'),
(3,6,100,CURDATE(),'Cash');

INSERT INTO refunds (id, order_id, amount, reason, refunded_on) VALUES
(1,4,400,'ECG cancelled by the doctor',CURDATE() - INTERVAL 3 DAY),
(2,3,100,'Billing error - overcharged',CURDATE() - INTERVAL 3 DAY);

INSERT INTO suppliers (id, name, contact_person, phone, email, address) VALUES
(1,'Square Pharmaceuticals Dist.','Mr. Salam','01911100001','square.dist@example.com','Tejgaon, Dhaka'),
(2,'Beximco Medical Supplies','Ms. Laila','01911100002','beximco.med@example.com','Motijheel, Dhaka'),
(3,'Incepta Healthcare Partner','Mr. Faruk','01911100003','incepta.hc@example.com','Savar, Dhaka'),
(4,'Renata Wholesale','Mr. Jamal','01911100004','renata.ws@example.com','Mirpur, Dhaka');

INSERT INTO units (id, name, short_name) VALUES
(1,'Piece','Pcs'),(2,'Box','Box'),(3,'Strip','Strip'),(4,'Bottle','Btl'),(5,'Vial','Vial'),(6,'Tube','Tube');

-- stock below already equals purchases minus usage
INSERT INTO products (id, name, unit_id, stock, reorder_level) VALUES
(1,'Surgical Gloves',2,30,25),
(2,'Syringe 5ml',2,70,40),
(3,'Cotton Roll',1,160,50),
(4,'Face Mask',2,80,100),
(5,'Gauze Bandage',1,150,30),
(6,'IV Cannula 20G',2,50,20);

INSERT INTO purchases (id, product_id, supplier_id, qty, unit_price, purchase_date) VALUES
(1,1,1,50,40,CURDATE() - INTERVAL 25 DAY),
(2,2,1,100,8,CURDATE() - INTERVAL 25 DAY),
(3,3,2,200,10,CURDATE() - INTERVAL 20 DAY),
(4,4,2,80,20,CURDATE() - INTERVAL 20 DAY),
(5,5,3,150,10,CURDATE() - INTERVAL 15 DAY),
(6,6,3,60,30,CURDATE() - INTERVAL 15 DAY);

INSERT INTO stock_usage (id, product_id, qty, used_by, usage_date, note) VALUES
(1,1,20,'Ward',CURDATE() - INTERVAL 12 DAY,'Weekly ward use'),
(2,2,30,'Emergency',CURDATE() - INTERVAL 9 DAY,'Emergency room'),
(3,3,40,'Dressing room',CURDATE() - INTERVAL 6 DAY,'Dressings'),
(4,6,10,'ICU',CURDATE() - INTERVAL 3 DAY,'IV lines');

-- stock below already equals purchases - purchase returns - sales + sales returns
INSERT INTO medicines (id, name, generic_name, category, unit_id, purchase_price, sale_price, stock, reorder_level, expiry_date) VALUES
(1,'Napa 500mg','Paracetamol','Tablet',3,8,10,465,100,CURDATE() + INTERVAL 18 MONTH),
(2,'Seclo 20','Omeprazole','Capsule',3,35,42,180,50,CURDATE() + INTERVAL 14 MONTH),
(3,'Ace Plus','Paracetamol + Caffeine','Tablet',3,6,8,240,100,CURDATE() + INTERVAL 20 MONTH),
(4,'Moxacil 500','Amoxicillin','Capsule',3,22,28,110,40,CURDATE() + INTERVAL 10 MONTH),
(5,'Napa Syrup','Paracetamol','Syrup',4,40,50,87,100,CURDATE() + INTERVAL 8 MONTH),
(6,'Ciprocin 500','Ciprofloxacin','Tablet',3,30,38,95,100,CURDATE() + INTERVAL 12 MONTH),
(7,'Normal Saline 500ml','Sodium Chloride','Injection',4,60,75,65,30,CURDATE() + INTERVAL 16 MONTH),
(8,'Fucidin Ointment','Fusidic Acid','Ointment',6,90,110,52,20,CURDATE() + INTERVAL 11 MONTH);

INSERT INTO medicine_purchases (id, medicine_id, supplier_id, invoice_no, qty, unit_cost, purchase_date) VALUES
(1,1,1,'INV-1001',500,8,CURDATE() - INTERVAL 28 DAY),
(2,2,1,'INV-1001',200,35,CURDATE() - INTERVAL 28 DAY),
(3,3,2,'INV-2001',300,6,CURDATE() - INTERVAL 24 DAY),
(4,4,2,'INV-2001',150,22,CURDATE() - INTERVAL 24 DAY),
(5,5,3,'INV-3001',100,40,CURDATE() - INTERVAL 18 DAY),
(6,6,3,'INV-3001',120,30,CURDATE() - INTERVAL 18 DAY),
(7,7,4,'INV-4001',80,60,CURDATE() - INTERVAL 12 DAY),
(8,8,4,'INV-4001',60,90,CURDATE() - INTERVAL 12 DAY);

INSERT INTO purchase_returns (id, medicine_id, supplier_id, qty, unit_cost, return_date, reason) VALUES
(1,4,2,10,22,CURDATE() - INTERVAL 20 DAY,'Damaged strips'),
(2,7,4,5,60,CURDATE() - INTERVAL 10 DAY,'Wrong batch delivered');

INSERT INTO supplier_payments (id, supplier_id, amount, method, paid_on, note) VALUES
(1,1,1100,'Bank transfer',CURDATE() - INTERVAL 22 DAY,'INV-1001 in full'),
(2,2,300,'Cheque',CURDATE() - INTERVAL 18 DAY,'Part payment INV-2001'),
(3,3,700,'Bank transfer',CURDATE() - INTERVAL 12 DAY,'INV-3001 in full'),
(4,4,500,'Cash',CURDATE() - INTERVAL 6 DAY,'Part payment INV-4001');

INSERT INTO medicine_sales (id, customer_name, medicine_id, qty, unit_price, sale_date) VALUES
(1,'Walk-in',1,40,10,CURDATE() - INTERVAL 9 DAY),
(2,'Karim Uddin',2,20,42,CURDATE() - INTERVAL 7 DAY),
(3,'Walk-in',3,60,8,CURDATE() - INTERVAL 6 DAY),
(4,'Sumaiya Khatun',4,30,28,CURDATE() - INTERVAL 5 DAY),
(5,'Walk-in',5,15,50,CURDATE() - INTERVAL 4 DAY),
(6,'Abdul Mannan',6,25,38,CURDATE() - INTERVAL 2 DAY),
(7,'Walk-in',7,10,75,CURDATE() - INTERVAL 1 DAY),
(8,'Walk-in',8,8,110,CURDATE());

INSERT INTO sales_returns (id, medicine_id, qty, refund_amount, return_date, reason) VALUES
(1,1,5,50,CURDATE() - INTERVAL 8 DAY,'Customer changed mind'),
(2,5,2,100,CURDATE() - INTERVAL 3 DAY,'Seal broken at purchase');

INSERT INTO expenses (id, title, category, amount, expense_date, note) VALUES
(1,'Electricity bill','Utilities',1850,CURDATE() - INTERVAL 14 DAY,'Monthly bill'),
(2,'Oxygen cylinder refill','Supplies',640,CURDATE() - INTERVAL 11 DAY,'4 cylinders'),
(3,'Generator maintenance','Maintenance',450,CURDATE() - INTERVAL 9 DAY,'Quarterly service'),
(4,'Staff overtime','Salary',1200,CURDATE() - INTERVAL 5 DAY,'Overtime allowance'),
(5,'Internet and phone','Utilities',320,CURDATE() - INTERVAL 4 DAY,'Monthly bill'),
(6,'Signboard printing','Marketing',550,CURDATE() - INTERVAL 1 DAY,'Front gate board');

INSERT INTO portal_slides (id, title, subtitle, image_url, button_text, button_link, sort_order, status) VALUES

(1,'Care that starts with a simple booking','Pick your doctor, choose a free time, and we will confirm your visit. No account needed.','/uploads/samples/slide-1.svg','Book an appointment','/portal/book',1,'Active'),
(2,'Diagnostics under one roof','Pathology, radiology and ECG, with results in your patient account as soon as they are ready.','/uploads/samples/slide-2.svg','See services and prices','/portal#services',2,'Active'),
(3,'Your health history, always with you','Create a free patient account to follow appointments, test reports and bills.','/uploads/samples/slide-3.svg','Create my account','/portal/register',3,'Active');

INSERT INTO portal_gallery (id, title, category, image_url, sort_order, status) VALUES

(1,'Reception and waiting area','Facilities','/uploads/samples/reception.svg',1,'Active'),
(2,'Emergency ward','Facilities','/uploads/samples/emergency.svg',2,'Active'),
(3,'Pathology laboratory','Diagnostics','/uploads/samples/laboratory.svg',3,'Active'),
(4,'Radiology and imaging','Diagnostics','/uploads/samples/imaging.svg',4,'Active'),
(5,'In-house pharmacy','Facilities','/uploads/samples/pharmacy.svg',5,'Active'),
(6,'Private patient rooms','Facilities','/uploads/samples/rooms.svg',6,'Active');
