import bcrypt from 'bcryptjs';

// effect: when a row is created/updated/deleted, adjust a number on a related row.
const stock = (target, fk, sign, amount = 'qty', field = 'stock') => [{ target, fk, field, amount, sign }];

export const resources = {
  roles: { table: 'roles', cols: ['name', 'permissions', 'description'], search: ['t.name'] },
  users: {
    table: 'users', cols: ['name', 'email', 'password', 'role_id', 'status'], search: ['t.name', 't.email'],
    select: 't.id, t.name, t.email, t.role_id, t.status, t.created_at',
    async prepare(d, isNew) {
      if (isNew && !d.password) throw Object.assign(new Error('Password is required'), { status: 400 });
      if (d.password) d.password = await bcrypt.hash(d.password, 10); else delete d.password;
    },
  },
  employees: { table: 'employees', cols: ['name', 'designation', 'department', 'phone', 'salary', 'join_date', 'status'], search: ['t.name', 't.designation', 't.department'] },
  auditors: { table: 'auditors', cols: ['name', 'email', 'phone', 'status'], search: ['t.name', 't.email'] },
  doctors: { table: 'doctors', cols: ['name', 'specialization', 'phone', 'email', 'fee', 'commission_percent', 'status'], search: ['t.name', 't.specialization'] },
  'doctor-payments': { table: 'doctor_payments', cols: ['doctor_id', 'amount', 'method', 'paid_on', 'note'], search: ['t.note'] },
  patients: {
    table: 'patients', cols: ['patient_code', 'name', 'age', 'gender', 'phone', 'blood_group', 'address'], search: ['t.name', 't.patient_code', 't.phone'],
    prepare(d, isNew) { if (isNew && !d.patient_code) d.patient_code = 'PT' + Date.now().toString().slice(-8); },
  },
  appointments: { table: 'appointments', cols: ['patient_id', 'doctor_id', 'appointment_date', 'appointment_time', 'status', 'note'], search: ['t.status', 't.note'] },
  services: { table: 'services', cols: ['name', 'category', 'price'], search: ['t.name', 't.category'] },
  orders: {
    table: 'service_orders', cols: ['patient_id', 'service_id', 'doctor_id', 'order_date', 'amount', 'discount', 'paid'],
    joins: 'LEFT JOIN patients p ON p.id = t.patient_id LEFT JOIN services s ON s.id = t.service_id',
    select: 't.*, p.name patient_name, p.patient_code, s.name service_name',
    search: ['p.name', 'p.patient_code', 's.name'],
  },
  'discount-requests': {
    table: 'discount_requests', cols: ['order_id', 'requested_discount', 'reason', 'status'], search: ['t.reason', 't.status'],
    async after(conn, old, row) { // approving a request applies the discount to the bill
      if (row.status === 'Approved' && old?.status !== 'Approved')
        await conn.query('UPDATE service_orders SET discount = discount + ? WHERE id = ?', [row.requested_discount, row.order_id]);
      if (old?.status === 'Approved' && row.status !== 'Approved')
        await conn.query('UPDATE service_orders SET discount = GREATEST(discount - ?, 0) WHERE id = ?', [old.requested_discount, old.order_id]);
    },
  },
  investigations: { table: 'investigations', cols: ['order_id', 'test_name', 'sample_date', 'result', 'status'], search: ['t.test_name', 't.status'] },
  'report-deliveries': { table: 'report_deliveries', cols: ['investigation_id', 'delivered_to', 'delivered_on', 'status'], search: ['t.delivered_to', 't.status'] },
  'due-collections': { table: 'due_collections', cols: ['order_id', 'amount', 'collected_on', 'method'], search: ['t.method'], effects: stock('service_orders', 'order_id', 1, 'amount', 'collected') },
  refunds: { table: 'refunds', cols: ['order_id', 'amount', 'reason', 'refunded_on'], search: ['t.reason'], effects: stock('service_orders', 'order_id', 1, 'amount', 'refunded') },
  suppliers: { table: 'suppliers', cols: ['name', 'contact_person', 'phone', 'email', 'address'], search: ['t.name', 't.contact_person', 't.phone'] },
  units: { table: 'units', cols: ['name', 'short_name'], search: ['t.name'] },
  products: { table: 'products', cols: ['name', 'unit_id', 'reorder_level'], search: ['t.name'] },
  purchases: { table: 'purchases', cols: ['product_id', 'supplier_id', 'qty', 'unit_price', 'purchase_date'], search: [], effects: stock('products', 'product_id', 1) },
  'stock-usage': { table: 'stock_usage', cols: ['product_id', 'qty', 'used_by', 'usage_date', 'note'], search: ['t.used_by', 't.note'], effects: stock('products', 'product_id', -1) },
  medicines: { table: 'medicines', cols: ['name', 'generic_name', 'category', 'unit_id', 'purchase_price', 'sale_price', 'reorder_level', 'expiry_date'], search: ['t.name', 't.generic_name', 't.category'] },
  'medicine-purchases': { table: 'medicine_purchases', cols: ['medicine_id', 'supplier_id', 'invoice_no', 'qty', 'unit_cost', 'purchase_date'], search: ['t.invoice_no'], effects: stock('medicines', 'medicine_id', 1) },
  'purchase-returns': { table: 'purchase_returns', cols: ['medicine_id', 'supplier_id', 'qty', 'unit_cost', 'return_date', 'reason'], search: ['t.reason'], effects: stock('medicines', 'medicine_id', -1) },
  'supplier-payments': { table: 'supplier_payments', cols: ['supplier_id', 'amount', 'method', 'paid_on', 'note'], search: ['t.note'] },
  'medicine-sales': { table: 'medicine_sales', cols: ['customer_name', 'medicine_id', 'qty', 'unit_price', 'sale_date'], search: ['t.customer_name'], effects: stock('medicines', 'medicine_id', -1) },
  'sales-returns': { table: 'sales_returns', cols: ['medicine_id', 'qty', 'refund_amount', 'return_date', 'reason'], search: ['t.reason'], effects: stock('medicines', 'medicine_id', 1) },
  expenses: { table: 'expenses', cols: ['title', 'category', 'amount', 'expense_date', 'note'], search: ['t.title', 't.category'] },
};
