import Dexie, { Table } from 'dexie';

export class AamaliDatabase extends Dexie {
  inventory!: Table<any, number>;
  sales!: Table<any, number>;
  employees!: Table<any, number>; // HR
  partners!: Table<any, number>; // CRM (العملاء والموردين)
  logs!: Table<any, number>;
  settings!: Table<any, number>;
  
  // New tables
  returns!: Table<any, number>;
  wastage!: Table<any, number>;
  invoices!: Table<any, number>;
  offers!: Table<any, number>;
  transactions!: Table<any, number>;
  importExport!: Table<any, number>;

  // V3 tables
  attendance!: Table<any, number>;
  payroll!: Table<any, number>;
  notifications!: Table<any, number>;

  // V4 tables
  accounts!: Table<any, number>;
  journalEntries!: Table<any, number>;
  journalLines!: Table<any, number>;
  cashFlow!: Table<any, number>;
  assets!: Table<any, number>;
  workspaces!: Table<any, number>;
  documents!: Table<any, number>;
  leaveRequests!: Table<any, number>;
  deductions!: Table<any, number>;

  constructor() {
    super('AamaliDB');
    
    // Version 1
    this.version(1).stores({
      inventory: '++id, name, category, quantity, price, barcode, expiryDate',
      sales: '++id, date, total, partnerId, type',
      employees: '++id, name, position, salary, status',
      partners: '++id, name, type, phone, balance',
      logs: '++id, action, date, details',
      settings: '++id, key, value'
    });

    // Version 2: Add new tables
    this.version(2).stores({
      returns: '++id, date, total, partnerId, type',
      wastage: '++id, date, itemId, quantity, reason',
      invoices: '++id, date, total, partnerId, type, status',
      offers: '++id, date, total, partnerId, type, status',
      transactions: '++id, date, amount, type, description',
      importExport: '++id, date, type, details'
    });

    // Version 3: HR, Notifications
    this.version(3).stores({
      attendance: '++id, employeeId, date, status',
      payroll: '++id, employeeId, date, basic, bonus, deduction, net',
      notifications: '++id, title, message, date, read, type'
    });

    // Version 4: Advanced ERP Features
    this.version(4).stores({
      accounts: '++id, name, type, parentId, balance', // Chart of accounts
      journalEntries: '++id, date, description, totalDebit, totalCredit',
      journalLines: '++id, entryId, accountId, debit, credit, description',
      cashFlow: '++id, date, type, amount, accountId, description, partnerId', // Receipts/Payments
      assets: '++id, name, purchaseDate, purchaseValue, depreciationRate, currentBookValue',
      workspaces: '++id, type, title, status, assignedTo, dueDate, content', // Kanban, Tickets
      documents: '++id, title, fileType, uploadDate, size, url' // DMS
    });

    // Version 5: HR Expansion
    this.version(5).stores({
      leaveRequests: '++id, employeeId, startDate, endDate, type, status, reason'
    });

    // Version 6: Employee Deductions & Penalties
    this.version(6).stores({
      deductions: '++id, employeeId, date, type, amount, reason, status'
    });
  }
}

export const db = new AamaliDatabase();


export async function initializeData() {
  const defaultData = [
    { section: 'المخزون', types: ['أجهزة', 'أثاث'], items: ['لابتوب', 'طاولة مكتب'] },
    { section: 'المبيعات', types: ['نقدية', 'آجلة'], items: ['فاتورة بيع', 'مرتجع'] },
    { section: 'المحاسبة', types: ['مصروفات', 'إيرادات'], items: ['رواتب', 'كهرباء'] }
  ];

  for (const s of defaultData) {
    for (const t of s.types) {
      for (const i of s.items) {
        const exists = await db.items.where({name: i, section: s.section}).first();
        if (!exists) {
          await db.items.add({ name: i, section: s.section, type: t });
        }
      }
    }
  }
}
