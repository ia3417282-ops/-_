import React, { useState, useMemo } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Package, Users, Wallet, 
  Calendar, ArrowUpRight, ArrowDownLeft, RefreshCcw 
} from 'lucide-react';

export default function Reports() {
  const [tab, setTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('all'); // all, month, year

  // جلب البيانات من كافة الجداول
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const sales = useLiveQuery(() => db.sales.toArray()) || [];
  const inventory = useLiveQuery(() => db.inventory.toArray()) || [];
  const partners = useLiveQuery(() => db.partners.toArray()) || [];
  const payroll = useLiveQuery(() => db.payroll.toArray()) || [];
  const returns = useLiveQuery(() => db.returns.toArray()) || [];

  // --- حسابات الربح والخسارة مع إدخال المرتجعات ---
  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    
    const grossSales = sales.filter(s => s.type === 'sale').reduce((acc, s) => acc + s.total, 0);
    const grossPurchases = sales.filter(s => s.type === 'purchase').reduce((acc, s) => acc + s.total, 0);
    
    const salesReturns = returns.filter(r => r.type === 'sales_return').reduce((acc, r) => acc + r.total, 0);
    const purchaseReturns = returns.filter(r => r.type === 'purchase_return').reduce((acc, r) => acc + r.total, 0);
    
    const totalSalaries = payroll.reduce((acc, p) => acc + (p.net || 0), 0);

    const netSales = grossSales - salesReturns;
    const netPurchases = grossPurchases - purchaseReturns;
    const netProfit = (netSales + totalIncome) - (netPurchases + totalExpense + totalSalaries);

    // حساب قيمة المخزون الحالية (سعر التكلفة * الكمية)
    const stockValue = inventory.reduce((acc, item) => acc + ((item.costPrice || 0) * (item.quantity || 0)), 0);

    return { 
      netSales, netPurchases, totalIncome, totalExpense, 
      totalSalaries, netProfit, stockValue, salesReturns, purchaseReturns 
    };
  }, [transactions, sales, inventory, payroll, returns]);

  // --- تحليل حركة الأصناف ---
  const itemMovement = useMemo(() => {
    return inventory.map(item => {
      const soldQuantity = sales
        .filter(s => s.type === 'sale')
        .reduce((acc, s) => {
          const soldItem = s.items?.find((i: any) => i.id === item.id || i.itemId === item.id);
          return acc + (soldItem ? Number(soldItem.quantity) : 0);
        }, 0);
      
      const returnedQuantity = returns
        .filter(r => r.type === 'sales_return')
        .reduce((acc, r) => {
          const retItem = r.items?.find((i: any) => i.itemId === item.id);
          return acc + (retItem ? Number(retItem.quantity) : 0);
        }, 0);

      return { 
        name: item.name, 
        actualSold: soldQuantity - returnedQuantity,
        stock: item.quantity 
      };
    }).sort((a, b) => b.actualSold - a.actualSold);
  }, [inventory, sales, returns]);

  const topItems = itemMovement.slice(0, 5);

  // --- حسابات الديون ---
  const customerDebts = partners.filter(p => p.type === 'customer' && p.balance > 0).reduce((acc, p) => acc + p.balance, 0);
  const supplierDebts = partners.filter(p => p.type === 'supplier' && p.balance > 0).reduce((acc, p) => acc + p.balance, 0);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* التبويبات العلوية */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit">
        {[
          { id: 'overview', label: 'نظرة عامة', icon: <TrendingUp size={18}/> },
          { id: 'financial', label: 'التقرير المالي', icon: <Wallet size={18}/> },
          { id: 'inventory', label: 'المخزون والحركة', icon: <Package size={18}/> },
          { id: 'debts', label: 'الديون والشركاء', icon: <Users size={18}/> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all ${tab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* المحتوى حسب التبويب */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* كروت الـ KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium">صافي المبيعات</p>
                  <h4 className="text-2xl font-black text-indigo-700 mt-1">{stats.netSales.toLocaleString()}</h4>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><ArrowUpRight size={20}/></div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">بعد خصم المرتجع: {stats.salesReturns}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium">قيمة المخزون</p>
                  <h4 className="text-2xl font-black text-emerald-700 mt-1">{stats.stockValue.toLocaleString()}</h4>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Package size={20}/></div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">رأس المال المحبوس في البضاعة</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium">ديون العملاء</p>
                  <h4 className="text-2xl font-black text-rose-600 mt-1">{customerDebts.toLocaleString()}</h4>
                </div>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Users size={20}/></div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">أموال خارج المؤسسة</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-medium">صافي الربح</p>
                  <h4 className={`text-2xl font-black mt-1 ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.netProfit.toLocaleString()}
                  </h4>
                </div>
                <div className={`p-2 rounded-lg ${stats.netProfit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {stats.netProfit >= 0 ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">الربح التشغيلي النهائي</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* رسم بياني للمصروفات */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><ArrowDownLeft className="text-red-500"/> تحليل النفقات</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'مشتريات', value: stats.netPurchases },
                        { name: 'مصروفات', value: stats.totalExpense },
                        { name: 'رواتب', value: stats.totalSalaries },
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {COLORS.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* الأصناف الأكثر مبيعاً */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><TrendingUp className="text-green-500"/> الأصناف الأعلى أداءً</h3>
              <div className="space-y-4">
                {topItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-bold text-gray-700">{item.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">مباع: <b className="text-indigo-600">{item.actualSold}</b></span>
                      <span className="text-xs text-gray-500">مخزن: <b>{item.stock}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'financial' && (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-md max-w-4xl mx-auto">
          <div className="flex justify-between items-center border-b pb-6 mb-8">
            <h3 className="text-2xl font-black text-gray-800 italic">قائمة الدخل الشاملة</h3>
            <div className="text-left">
              <p className="text-sm text-gray-400">تاريخ التقرير</p>
              <p className="font-mono font-bold">{new Date().toLocaleDateString('ar-EG')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <section>
              <h4 className="text-sm font-bold text-indigo-600 mb-2 border-b border-indigo-50">الإيرادات</h4>
              <div className="flex justify-between py-2"><span>إجمالي المبيعات</span><span className="font-mono">{stats.netSales + stats.salesReturns}</span></div>
              <div className="flex justify-between py-2 text-red-500 text-sm italic"><span>(ناقص) مرتجعات مبيعات</span><span>-{stats.salesReturns}</span></div>
              <div className="flex justify-between py-2"><span>إيرادات أخرى</span><span className="font-mono">{stats.totalIncome}</span></div>
              <div className="flex justify-between py-2 font-bold bg-indigo-50 px-2 rounded"><span>إجمالي الدخل التشغيلي</span><span className="text-indigo-700">{(stats.netSales + stats.totalIncome).toLocaleString()}</span></div>
            </section>

            <section className="mt-8">
              <h4 className="text-sm font-bold text-rose-600 mb-2 border-b border-rose-50">التكاليف والمصاريف</h4>
              <div className="flex justify-between py-2"><span>صافي المشتريات</span><span className="font-mono">{stats.netPurchases}</span></div>
              <div className="flex justify-between py-2"><span>المصروفات العامة</span><span className="font-mono">{stats.totalExpense}</span></div>
              <div className="flex justify-between py-2"><span>إجمالي الرواتب</span><span className="font-mono">{stats.totalSalaries}</span></div>
              <div className="flex justify-between py-2 font-bold bg-rose-50 px-2 rounded"><span>إجمالي التكاليف</span><span className="text-rose-700">{(stats.netPurchases + stats.totalExpense + stats.totalSalaries).toLocaleString()}</span></div>
            </section>

            <div className={`mt-10 p-6 rounded-2xl flex justify-between items-center ${stats.netProfit >= 0 ? 'bg-indigo-900 text-white shadow-indigo-200' : 'bg-red-900 text-white'} shadow-2xl`}>
              <div>
                <p className="text-sm opacity-80">صافي الربح / الخسارة النهائي</p>
                <h2 className="text-4xl font-black mt-1">{stats.netProfit.toLocaleString()}</h2>
              </div>
              <div className="bg-white/20 p-4 rounded-full">
                {stats.netProfit >= 0 ? <TrendingUp size={48}/> : <TrendingDown size={48}/>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'debts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-rose-600 text-white font-bold flex justify-between items-center">
              <span>ديون مستحقة على العملاء (لنا)</span>
              <span className="text-xl font-black">{customerDebts.toLocaleString()}</span>
            </div>
            <div className="p-4 space-y-3">
              {partners.filter(p => p.type === 'customer' && p.balance > 0).map(c => (
                <div key={c.id} className="flex justify-between p-3 bg-gray-50 rounded-lg border-r-4 border-rose-500">
                  <span className="font-bold text-gray-700">{c.name}</span>
                  <span className="font-mono text-rose-600 font-black">{c.balance.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-800 text-white font-bold flex justify-between items-center">
              <span>ديون مستحقة للموردين (علينا)</span>
              <span className="text-xl font-black">{supplierDebts.toLocaleString()}</span>
            </div>
            <div className="p-4 space-y-3">
              {partners.filter(p => p.type === 'supplier' && p.balance > 0).map(s => (
                <div key={s.id} className="flex justify-between p-3 bg-gray-50 rounded-lg border-r-4 border-gray-500">
                  <span className="font-bold text-gray-700">{s.name}</span>
                  <span className="font-mono text-gray-600 font-black">{s.balance.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'inventory' && (
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-indigo-900">تحليل كفاءة المخزون</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={itemMovement.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="actualSold" fill="#4f46e5" name="الكمية المباعة (صافي)" />
                  <Bar dataKey="stock" fill="#e2e8f0" name="الكمية المتوفرة حالياً" />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>
      )}
    </div>
  );
}
