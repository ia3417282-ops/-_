import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Reports() {
  const [tab, setTab] = useState('pnl');
  
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const sales = useLiveQuery(() => db.sales.toArray()) || [];
  const inventory = useLiveQuery(() => db.inventory.toArray()) || [];
  const partners = useLiveQuery(() => db.partners.toArray()) || [];
  const payroll = useLiveQuery(() => db.payroll.toArray()) || [];

  // P&L Calculations
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const totalSales = sales.filter(s => s.type === 'sale').reduce((acc, s) => acc + s.total, 0);
  const totalPurchases = sales.filter(s => s.type === 'purchase').reduce((acc, s) => acc + s.total, 0);
  const totalSalaries = payroll.reduce((acc, p) => acc + (p.net || 0), 0);
  
  const netProfit = (totalSales + totalIncome) - (totalPurchases + totalExpense + totalSalaries);

  // Item Movement Calculations
  const itemMovement = inventory.map(item => {
    const itemSales = sales.filter(s => s.type === 'sale' && s.items?.some((i: any) => i.id === item.id));
    const soldQuantity = itemSales.reduce((acc, s) => {
      const soldItem = s.items?.find((i: any) => i.id === item.id);
      return acc + (soldItem ? soldItem.quantity : 0);
    }, 0);
    return { name: item.name, sold: soldQuantity, stock: item.quantity };
  }).sort((a, b) => b.sold - a.sold);

  const topSelling = itemMovement.slice(0, 5);
  const slowMoving = [...itemMovement].sort((a, b) => a.sold - b.sold).slice(0, 5);

  // Debts Calculations
  const customersWithDebt = partners.filter(p => p.type === 'customer' && p.balance > 0);
  const suppliersWithCredit = partners.filter(p => p.type === 'supplier' && p.balance > 0);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b pb-2 overflow-x-auto">
        <button onClick={() => setTab('pnl')} className={`px-4 py-2 whitespace-nowrap ${tab === 'pnl' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500'}`}>الأرباح والخسائر الشاملة</button>
        <button onClick={() => setTab('movement')} className={`px-4 py-2 whitespace-nowrap ${tab === 'movement' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500'}`}>حركة الأصناف</button>
        <button onClick={() => setTab('debts')} className={`px-4 py-2 whitespace-nowrap ${tab === 'debts' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500'}`}>ديون العملاء والموردين</button>
      </div>

      {tab === 'pnl' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-3xl mx-auto">
          <h3 className="text-xl font-bold mb-6 text-indigo-900 text-center">تقرير الأرباح والخسائر الشامل</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 text-green-900 rounded border border-green-200">
              <span>المبيعات:</span><span className="font-bold" dir="ltr">{totalSales}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 text-green-900 rounded border border-green-200">
              <span>إيرادات أخرى:</span><span className="font-bold" dir="ltr">{totalIncome}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 text-red-900 rounded border border-red-200">
              <span>المشتريات (التكاليف):</span><span className="font-bold" dir="ltr">{totalPurchases}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 text-red-900 rounded border border-red-200">
              <span>المصروفات العامة:</span><span className="font-bold" dir="ltr">{totalExpense}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 text-orange-900 rounded border border-orange-200">
              <span>رواتب الموظفين:</span><span className="font-bold" dir="ltr">{totalSalaries}</span>
            </div>
            <div className="h-px bg-gray-300 my-4"></div>
            <div className={`flex justify-between items-center p-6 rounded-xl text-2xl font-bold border ${netProfit >= 0 ? 'bg-indigo-100 text-indigo-900 border-indigo-200' : 'bg-rose-100 text-rose-900 border-rose-200'}`}>
              <span>صافي الربح / الخسارة:</span><span dir="ltr">{netProfit}</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'movement' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-green-800">الأصناف الأكثر مبيعاً</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSelling} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="sold" fill="#10b981" name="الكمية المباعة" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-red-800">الأصناف الأكثر ركوداً</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={slowMoving} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="sold" fill="#ef4444" name="الكمية المباعة" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'debts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-indigo-900 border-b pb-2">ديون لنا (على العملاء)</h3>
            {customersWithDebt.length > 0 ? (
              <ul className="space-y-3">
                {customersWithDebt.map(c => (
                  <li key={c.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-red-600 font-bold" dir="ltr">{c.balance}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">لا توجد ديون مستحقة على العملاء</p>
            )}
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-indigo-900 border-b pb-2">ديون علينا (للموردين)</h3>
            {suppliersWithCredit.length > 0 ? (
              <ul className="space-y-3">
                {suppliersWithCredit.map(s => (
                  <li key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-red-600 font-bold" dir="ltr">{s.balance}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">لا توجد ديون مستحقة للموردين</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
