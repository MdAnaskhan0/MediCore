import {
  FiShield, FiUsers, FiUserCheck, FiBriefcase, FiActivity, FiDollarSign, FiCalendar, FiClipboard, FiTag, FiPercent,
  FiFileText, FiTruck, FiBox, FiPackage, FiShoppingCart, FiRotateCcw, FiCreditCard, FiBarChart2, FiTrendingUp,
  FiPieChart, FiAlertCircle, FiSend, FiLayers, FiUser, FiList, FiCornerDownLeft, FiDatabase,
} from 'react-icons/fi';

/* ---------- field helpers ---------- */
const f = (name, label, type = 'text', o = {}) => ({ name, label, type, ...o });
const num = (name, label, o = {}) => f(name, label, 'number', o);
const cash = (name, label, o = {}) => f(name, label, 'number', { money: true, step: '0.01', ...o });
const date = (name, label, o = {}) => f(name, label, 'date', { today: false, ...o });
const opt = (name, label, options, o = {}) => f(name, label, 'select', { options, ...o });
const ref = (name, label, res, lab = 'name', o = {}) => f(name, label, 'select', { ref: { res, lab }, ...o });

const STATUS = ['Active', 'Inactive'];
const METHOD = ['Cash', 'Bank transfer', 'Cheque', 'Mobile banking', 'Card'];
const ORDER_LABEL = '#{id} · {patient_name} · {service_name}';
const TODAY = { today: true, required: true };

/* ---------- shared field sets ---------- */
const purchaseF = [
  ref('product_id', 'Product', 'products', 'name', { required: true }),
  ref('supplier_id', 'Supplier', 'suppliers', 'name', { required: true }),
  num('qty', 'Quantity', { required: true, min: 1 }), cash('unit_price', 'Unit price', { required: true }), date('purchase_date', 'Purchase date', TODAY),
];
const medPurchaseF = [
  ref('medicine_id', 'Medicine', 'medicines', 'name', { required: true, fill: { from: 'purchase_price', to: 'unit_cost' } }),
  ref('supplier_id', 'Supplier', 'suppliers', 'name', { required: true }), f('invoice_no', 'Invoice no.'),
  num('qty', 'Quantity', { required: true, min: 1 }), cash('unit_cost', 'Unit cost', { required: true }), date('purchase_date', 'Purchase date', TODAY),
];
const medSaleF = [
  f('customer_name', 'Customer', 'text', { default: 'Walk-in' }),
  ref('medicine_id', 'Medicine', 'medicines', '{name} (stock {stock})', { required: true, fill: { from: 'sale_price', to: 'unit_price' } }),
  num('qty', 'Quantity', { required: true, min: 1 }), cash('unit_price', 'Unit price', { required: true }), date('sale_date', 'Sale date', TODAY),
];
const stockCols = [{ name: 'stock', label: 'In stock', stock: true }];
const totalCol = [{ name: 'total', label: 'Total', money: true }];

/* ---------- pages (array order = sidebar order) ---------- */
export const pages = [
  // Administration
  { group: 'Administration', key: 'roles', res: 'roles', title: 'Role & permission', icon: FiShield,
    hint: 'Permissions: use * for full access, or a comma-separated list of page keys, for example patients,appointments,medicine-sales.',
    fields: [f('name', 'Role name', 'text', { required: true }), f('permissions', 'Permissions', 'text', { placeholder: '* or patients,appointments,…' }), f('description', 'Description')] },
  { group: 'Administration', key: 'users', res: 'users', title: 'User management', icon: FiUsers,
    fields: [f('name', 'Full name', 'text', { required: true }), f('email', 'Email', 'email', { required: true }),
      f('password', 'Password', 'password', { hide: true, hintEdit: 'Leave blank to keep the current password' }),
      ref('role_id', 'Role', 'roles', 'name', { required: true }), opt('status', 'Status', STATUS, { default: 'Active' })] },
  { group: 'Administration', key: 'hr', res: 'employees', title: 'HR management', icon: FiBriefcase,
    fields: [f('name', 'Employee name', 'text', { required: true }), f('designation', 'Designation'), f('department', 'Department'), f('phone', 'Phone'),
      cash('salary', 'Monthly salary'), date('join_date', 'Joining date'), opt('status', 'Status', ['Active', 'On leave', 'Resigned'], { default: 'Active' })] },
  { group: 'Administration', key: 'auditors', res: 'auditors', title: 'Auditor management', icon: FiUserCheck,
    fields: [f('name', 'Auditor name', 'text', { required: true }), f('email', 'Email', 'email'), f('phone', 'Phone'), opt('status', 'Status', STATUS, { default: 'Active' })] },

  // Doctor management
  { group: 'Doctor Management', key: 'doctors', res: 'doctors', title: 'Doctor information', icon: FiActivity,
    fields: [f('name', 'Doctor name', 'text', { required: true }), f('specialization', 'Specialization'), f('phone', 'Phone'), f('email', 'Email', 'email'),
      cash('fee', 'Consultation fee'), num('commission_percent', 'Commission (%)', { step: '0.01', min: 0, max: 100 }), opt('status', 'Status', STATUS, { default: 'Active' })] },
  { group: 'Doctor Management', key: 'doctor-payments', res: 'doctor-payments', title: 'Doctor payment', icon: FiDollarSign,
    fields: [ref('doctor_id', 'Doctor', 'doctors', 'name', { required: true }), cash('amount', 'Amount', { required: true }), opt('method', 'Method', METHOD, { default: 'Cash' }),
      date('paid_on', 'Payment date', TODAY), f('note', 'Note')] },

  // Patient management
  { group: 'Patient Management', key: 'patients', res: 'patients', title: 'Patient registration & info', icon: FiUser,
    extra: [{ name: 'patient_code', label: 'Patient ID', first: true }],
    fields: [f('name', 'Patient name', 'text', { required: true }), num('age', 'Age', { min: 0 }), opt('gender', 'Gender', ['Male', 'Female', 'Other']), f('phone', 'Phone'),
      opt('blood_group', 'Blood group', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']), f('address', 'Address')] },
  { group: 'Patient Management', key: 'appointments', res: 'appointments', title: 'Appointment management', icon: FiCalendar,
    fields: [ref('patient_id', 'Patient', 'patients', '{name} ({patient_code})', { required: true }), ref('doctor_id', 'Doctor', 'doctors', 'name', { required: true }),
      date('appointment_date', 'Date', TODAY), f('appointment_time', 'Time', 'time'),
      opt('status', 'Status', ['Scheduled', 'Completed', 'Cancelled'], { default: 'Scheduled' }), f('note', 'Note')] },

  // Patient services
  { group: 'Patient Services', key: 'services', res: 'services', title: 'Patient service list', icon: FiList,
    fields: [f('name', 'Service name', 'text', { required: true }), opt('category', 'Category', ['Consultation', 'Pathology', 'Radiology', 'Procedure', 'Other']), cash('price', 'Price', { required: true })] },
  { group: 'Patient Services', key: 'orders', res: 'orders', title: 'Patient list (billing)', icon: FiClipboard,
    hint: 'Pick a service and its price is filled in for you. Outstanding dues are collected under Due collection.',
    extra: [{ name: 'due', label: 'Due', money: true, due: true }],
    fields: [ref('patient_id', 'Patient', 'patients', '{name} ({patient_code})', { required: true }), ref('service_id', 'Service', 'services', 'name', { required: true, fill: { from: 'price', to: 'amount' } }),
      ref('doctor_id', 'Referred doctor', 'doctors', 'name'), date('order_date', 'Bill date', TODAY),
      cash('amount', 'Amount', { required: true }), cash('discount', 'Discount', { default: 0 }), cash('paid', 'Paid now', { default: 0 })] },
  { group: 'Patient Services', key: 'discount-requests', res: 'discount-requests', title: 'Discount request', icon: FiPercent,
    hint: 'Setting a request to Approved applies the discount to the bill automatically.',
    fields: [ref('order_id', 'Bill', 'orders', ORDER_LABEL, { required: true }), cash('requested_discount', 'Discount amount', { required: true }), f('reason', 'Reason'),
      opt('status', 'Status', ['Pending', 'Approved', 'Rejected'], { default: 'Pending' })] },
  { group: 'Patient Services', key: 'investigations', res: 'investigations', title: 'Investigation info', icon: FiFileText,
    fields: [ref('order_id', 'Bill', 'orders', ORDER_LABEL, { required: true }), f('test_name', 'Test name', 'text', { required: true }), date('sample_date', 'Sample date'),
      f('result', 'Result', 'textarea', { hide: true }), opt('status', 'Status', ['Pending', 'In progress', 'Completed'], { default: 'Pending' })] },
  { group: 'Patient Services', key: 'report-deliveries', res: 'report-deliveries', title: 'Report delivery', icon: FiSend,
    fields: [ref('investigation_id', 'Investigation', 'investigations', '#{id} · {test_name}', { required: true }), f('delivered_to', 'Delivered to'), date('delivered_on', 'Delivery date'),
      opt('status', 'Status', ['Pending', 'Delivered'], { default: 'Pending' })] },
  { group: 'Patient Services', key: 'due-collections', res: 'due-collections', title: 'Due collection', icon: FiCreditCard,
    fields: [ref('order_id', 'Bill', 'orders', ORDER_LABEL, { required: true }), cash('amount', 'Amount collected', { required: true }), date('collected_on', 'Collection date', TODAY), opt('method', 'Method', METHOD, { default: 'Cash' })] },
  { group: 'Patient Services', key: 'refunds', res: 'refunds', title: 'Refund management', icon: FiCornerDownLeft,
    fields: [ref('order_id', 'Bill', 'orders', ORDER_LABEL, { required: true }), cash('amount', 'Refund amount', { required: true }), f('reason', 'Reason'), date('refunded_on', 'Refund date', TODAY)] },

  // Inventory setup
  { group: 'Inventory Setup', key: 'suppliers', res: 'suppliers', title: 'Supplier management', icon: FiTruck,
    fields: [f('name', 'Supplier name', 'text', { required: true }), f('contact_person', 'Contact person'), f('phone', 'Phone'), f('email', 'Email', 'email'), f('address', 'Address')] },
  { group: 'Inventory Setup', key: 'units', res: 'units', title: 'Unit management', icon: FiLayers,
    fields: [f('name', 'Unit name', 'text', { required: true }), f('short_name', 'Short name')] },

  // General stock
  { group: 'General Stock', key: 'products', res: 'products', title: 'Product entry', icon: FiBox, extra: stockCols,
    fields: [f('name', 'Product name', 'text', { required: true }), ref('unit_id', 'Unit', 'units'), num('reorder_level', 'Reorder level', { default: 0, min: 0 })] },
  { group: 'General Stock', key: 'purchases', res: 'purchases', title: 'Purchase entry', icon: FiShoppingCart, extra: totalCol, fields: purchaseF },
  { group: 'General Stock', key: 'purchase-list', res: 'purchases', title: 'Purchase list', icon: FiList, readOnly: true, extra: totalCol, fields: purchaseF },
  { group: 'General Stock', key: 'stock-usage', res: 'stock-usage', title: 'Stock usage', icon: FiPackage,
    fields: [ref('product_id', 'Product', 'products', '{name} (stock {stock})', { required: true }), num('qty', 'Quantity used', { required: true, min: 1 }), f('used_by', 'Used by / department'), date('usage_date', 'Date', TODAY), f('note', 'Note')] },
  { group: 'General Stock', key: 'stock-report', res: 'products', title: 'Stock report', icon: FiBarChart2, readOnly: true, extra: stockCols,
    fields: [f('name', 'Product'), ref('unit_id', 'Unit', 'units'), num('reorder_level', 'Reorder level')] },

  // Medicine management
  { group: 'Medicine Management', key: 'medicines', res: 'medicines', title: 'Medicine list', icon: FiDatabase, extra: stockCols,
    fields: [f('name', 'Medicine name', 'text', { required: true }), f('generic_name', 'Generic name'), opt('category', 'Category', ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Other']),
      ref('unit_id', 'Unit', 'units'), cash('purchase_price', 'Purchase price'), cash('sale_price', 'Sale price'), num('reorder_level', 'Reorder level', { default: 0, min: 0 }), date('expiry_date', 'Expiry date')] },
  { group: 'Medicine Management', key: 'medicine-purchases', res: 'medicine-purchases', title: 'Medicine purchase', icon: FiShoppingCart, extra: totalCol, fields: medPurchaseF },
  { group: 'Medicine Management', key: 'medicine-purchase-list', res: 'medicine-purchases', title: 'Medicine purchase list', icon: FiList, readOnly: true, extra: totalCol, fields: medPurchaseF },
  { group: 'Medicine Management', key: 'purchase-returns', res: 'purchase-returns', title: 'Purchase return', icon: FiRotateCcw, extra: totalCol,
    fields: [ref('medicine_id', 'Medicine', 'medicines', '{name} (stock {stock})', { required: true, fill: { from: 'purchase_price', to: 'unit_cost' } }), ref('supplier_id', 'Supplier', 'suppliers', 'name', { required: true }),
      num('qty', 'Quantity', { required: true, min: 1 }), cash('unit_cost', 'Unit cost', { required: true }), date('return_date', 'Return date', TODAY), f('reason', 'Reason')] },
  { group: 'Medicine Management', key: 'supplier-payments', res: 'supplier-payments', title: 'Supplier payment', icon: FiCreditCard,
    fields: [ref('supplier_id', 'Supplier', 'suppliers', 'name', { required: true }), cash('amount', 'Amount', { required: true }), opt('method', 'Method', METHOD, { default: 'Cash' }), date('paid_on', 'Payment date', TODAY), f('note', 'Note')] },
  { group: 'Medicine Management', key: 'medicine-sales', res: 'medicine-sales', title: 'Medicine sales', icon: FiTag, extra: totalCol, fields: medSaleF },
  { group: 'Medicine Management', key: 'medicine-sales-list', res: 'medicine-sales', title: 'Medicine sales list', icon: FiList, readOnly: true, extra: totalCol, fields: medSaleF },
  { group: 'Medicine Management', key: 'sales-returns', res: 'sales-returns', title: 'Sales return', icon: FiRotateCcw,
    fields: [ref('medicine_id', 'Medicine', 'medicines', 'name', { required: true }), num('qty', 'Quantity returned', { required: true, min: 1 }), cash('refund_amount', 'Refund amount'), date('return_date', 'Return date', TODAY), f('reason', 'Reason')] },
  { group: 'Medicine Management', key: 'report-medicine', report: 'medicine', title: 'Medicine reports', icon: FiPieChart },
  { group: 'Medicine Management', key: 'medicine-stock-report', res: 'medicines', title: 'Medicine stock reports', icon: FiAlertCircle, readOnly: true, extra: stockCols,
    fields: [f('name', 'Medicine'), f('generic_name', 'Generic name'), f('category', 'Category'), cash('sale_price', 'Sale price'), num('reorder_level', 'Reorder level'), date('expiry_date', 'Expiry date')] },

  // Accounts
  { group: 'Accounts', key: 'report-financial', report: 'financial', title: 'Financial reports', icon: FiTrendingUp },
  { group: 'Accounts', key: 'report-income-expense', report: 'income-expense', title: 'Income & expense reports', icon: FiBarChart2 },
  { group: 'Accounts', key: 'report-collection', report: 'collection', title: 'Collection reports', icon: FiDollarSign },
  { group: 'Accounts', key: 'report-due', report: 'due', title: 'Due reports', icon: FiAlertCircle },
  { group: 'Accounts', key: 'expenses', res: 'expenses', title: 'Expense entry', icon: FiCreditCard,
    fields: [f('title', 'Title', 'text', { required: true }), opt('category', 'Category', ['Utilities', 'Maintenance', 'Salary', 'Supplies', 'Marketing', 'Other']), cash('amount', 'Amount', { required: true }), date('expense_date', 'Date', TODAY), f('note', 'Note')] },

  // Reports
  { group: 'Reports', key: 'report-total', report: 'total', title: 'Total system reports', icon: FiPieChart },
];

export const groupOrder = ['Administration', 'Doctor Management', 'Patient Management', 'Patient Services', 'Inventory Setup', 'General Stock', 'Medicine Management', 'Accounts', 'Reports'];
export const navGroups = groupOrder.map(name => ({ name, items: pages.filter(p => p.group === name) }));
export const canSee = (user, key) => !user?.permissions || user.permissions.trim() === '*' || user.permissions.split(',').map(s => s.trim()).includes(key);
