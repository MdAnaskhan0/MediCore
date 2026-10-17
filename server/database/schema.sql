CREATE DATABASE IF NOT EXISTS hospital_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_db;

CREATE TABLE IF NOT EXISTS roles (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(80) NOT NULL UNIQUE, permissions TEXT, description VARCHAR(255));
CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(150) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, role_id INT NOT NULL, status VARCHAR(20) DEFAULT 'Active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (role_id) REFERENCES roles(id));
CREATE TABLE IF NOT EXISTS employees (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, designation VARCHAR(100), department VARCHAR(100), phone VARCHAR(30), salary DECIMAL(12,2) NOT NULL DEFAULT 0, join_date DATE, status VARCHAR(20) DEFAULT 'Active');
CREATE TABLE IF NOT EXISTS auditors (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(150), phone VARCHAR(30), status VARCHAR(20) DEFAULT 'Active');

CREATE TABLE IF NOT EXISTS doctors (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, specialization VARCHAR(120), phone VARCHAR(30), email VARCHAR(150), fee DECIMAL(12,2) NOT NULL DEFAULT 0, commission_percent DECIMAL(5,2) NOT NULL DEFAULT 0, status VARCHAR(20) DEFAULT 'Active');
CREATE TABLE IF NOT EXISTS doctor_payments (id INT AUTO_INCREMENT PRIMARY KEY, doctor_id INT NOT NULL, amount DECIMAL(12,2) NOT NULL, method VARCHAR(30), paid_on DATE NOT NULL, note VARCHAR(255), FOREIGN KEY (doctor_id) REFERENCES doctors(id));

CREATE TABLE IF NOT EXISTS patients (id INT AUTO_INCREMENT PRIMARY KEY, patient_code VARCHAR(30) NOT NULL UNIQUE, name VARCHAR(120) NOT NULL, age INT, gender VARCHAR(15), phone VARCHAR(30), blood_group VARCHAR(5), address VARCHAR(255));
CREATE TABLE IF NOT EXISTS appointments (id INT AUTO_INCREMENT PRIMARY KEY, patient_id INT NOT NULL, doctor_id INT NOT NULL, appointment_date DATE NOT NULL, appointment_time TIME, status VARCHAR(20) DEFAULT 'Scheduled', note VARCHAR(255), FOREIGN KEY (patient_id) REFERENCES patients(id), FOREIGN KEY (doctor_id) REFERENCES doctors(id));
CREATE TABLE IF NOT EXISTS services (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, category VARCHAR(50), price DECIMAL(12,2) NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS service_orders (
  id INT AUTO_INCREMENT PRIMARY KEY, patient_id INT NOT NULL, service_id INT NOT NULL, doctor_id INT NULL, order_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0, discount DECIMAL(12,2) NOT NULL DEFAULT 0, paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  collected DECIMAL(12,2) NOT NULL DEFAULT 0, refunded DECIMAL(12,2) NOT NULL DEFAULT 0,
  due DECIMAL(12,2) AS (amount - discount - paid - collected) STORED,
  FOREIGN KEY (patient_id) REFERENCES patients(id), FOREIGN KEY (service_id) REFERENCES services(id), FOREIGN KEY (doctor_id) REFERENCES doctors(id));
CREATE TABLE IF NOT EXISTS discount_requests (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, requested_discount DECIMAL(12,2) NOT NULL, reason VARCHAR(255), status VARCHAR(20) DEFAULT 'Pending', FOREIGN KEY (order_id) REFERENCES service_orders(id));
CREATE TABLE IF NOT EXISTS investigations (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, test_name VARCHAR(150) NOT NULL, sample_date DATE, result TEXT, status VARCHAR(20) DEFAULT 'Pending', FOREIGN KEY (order_id) REFERENCES service_orders(id));
CREATE TABLE IF NOT EXISTS report_deliveries (id INT AUTO_INCREMENT PRIMARY KEY, investigation_id INT NOT NULL, delivered_to VARCHAR(120), delivered_on DATE, status VARCHAR(20) DEFAULT 'Pending', FOREIGN KEY (investigation_id) REFERENCES investigations(id));
CREATE TABLE IF NOT EXISTS due_collections (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, amount DECIMAL(12,2) NOT NULL, collected_on DATE NOT NULL, method VARCHAR(30), FOREIGN KEY (order_id) REFERENCES service_orders(id));
CREATE TABLE IF NOT EXISTS refunds (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, amount DECIMAL(12,2) NOT NULL, reason VARCHAR(255), refunded_on DATE NOT NULL, FOREIGN KEY (order_id) REFERENCES service_orders(id));

CREATE TABLE IF NOT EXISTS suppliers (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, contact_person VARCHAR(120), phone VARCHAR(30), email VARCHAR(150), address VARCHAR(255));
CREATE TABLE IF NOT EXISTS units (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(60) NOT NULL UNIQUE, short_name VARCHAR(15));
CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, unit_id INT, stock INT NOT NULL DEFAULT 0, reorder_level INT NOT NULL DEFAULT 0, FOREIGN KEY (unit_id) REFERENCES units(id));
CREATE TABLE IF NOT EXISTS purchases (id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, supplier_id INT NOT NULL, qty INT NOT NULL, unit_price DECIMAL(12,2) NOT NULL, total DECIMAL(14,2) AS (qty * unit_price) STORED, purchase_date DATE NOT NULL, FOREIGN KEY (product_id) REFERENCES products(id), FOREIGN KEY (supplier_id) REFERENCES suppliers(id));
CREATE TABLE IF NOT EXISTS stock_usage (id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL, qty INT NOT NULL, used_by VARCHAR(120), usage_date DATE NOT NULL, note VARCHAR(255), FOREIGN KEY (product_id) REFERENCES products(id));

CREATE TABLE IF NOT EXISTS medicines (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(150) NOT NULL, generic_name VARCHAR(150), category VARCHAR(50), unit_id INT, purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0, sale_price DECIMAL(12,2) NOT NULL DEFAULT 0, stock INT NOT NULL DEFAULT 0, reorder_level INT NOT NULL DEFAULT 0, expiry_date DATE, FOREIGN KEY (unit_id) REFERENCES units(id));
CREATE TABLE IF NOT EXISTS medicine_purchases (id INT AUTO_INCREMENT PRIMARY KEY, medicine_id INT NOT NULL, supplier_id INT NOT NULL, invoice_no VARCHAR(50), qty INT NOT NULL, unit_cost DECIMAL(12,2) NOT NULL, total DECIMAL(14,2) AS (qty * unit_cost) STORED, purchase_date DATE NOT NULL, FOREIGN KEY (medicine_id) REFERENCES medicines(id), FOREIGN KEY (supplier_id) REFERENCES suppliers(id));
CREATE TABLE IF NOT EXISTS purchase_returns (id INT AUTO_INCREMENT PRIMARY KEY, medicine_id INT NOT NULL, supplier_id INT NOT NULL, qty INT NOT NULL, unit_cost DECIMAL(12,2) NOT NULL, total DECIMAL(14,2) AS (qty * unit_cost) STORED, return_date DATE NOT NULL, reason VARCHAR(255), FOREIGN KEY (medicine_id) REFERENCES medicines(id), FOREIGN KEY (supplier_id) REFERENCES suppliers(id));
CREATE TABLE IF NOT EXISTS supplier_payments (id INT AUTO_INCREMENT PRIMARY KEY, supplier_id INT NOT NULL, amount DECIMAL(12,2) NOT NULL, method VARCHAR(30), paid_on DATE NOT NULL, note VARCHAR(255), FOREIGN KEY (supplier_id) REFERENCES suppliers(id));
CREATE TABLE IF NOT EXISTS medicine_sales (id INT AUTO_INCREMENT PRIMARY KEY, customer_name VARCHAR(120) DEFAULT 'Walk-in', medicine_id INT NOT NULL, qty INT NOT NULL, unit_price DECIMAL(12,2) NOT NULL, total DECIMAL(14,2) AS (qty * unit_price) STORED, sale_date DATE NOT NULL, FOREIGN KEY (medicine_id) REFERENCES medicines(id));
CREATE TABLE IF NOT EXISTS sales_returns (id INT AUTO_INCREMENT PRIMARY KEY, medicine_id INT NOT NULL, qty INT NOT NULL, refund_amount DECIMAL(12,2) NOT NULL DEFAULT 0, return_date DATE NOT NULL, reason VARCHAR(255), FOREIGN KEY (medicine_id) REFERENCES medicines(id));
CREATE TABLE IF NOT EXISTS expenses (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(150) NOT NULL, category VARCHAR(60), amount DECIMAL(12,2) NOT NULL, expense_date DATE NOT NULL, note VARCHAR(255));
