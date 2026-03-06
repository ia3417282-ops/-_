import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Wallet, FileText, ArrowDownRight, ArrowUpRight, BookOpen, Building2 } from 'lucide-react';

export default function Accounts() {
  const [tab, setTab] = useState('transactions');
  
  // Existing data
  const transactions = useLiveQuery(() => db.transactions.toArray());
  const sales = useLiveQuery(() => db.sales.toArray());
  
  // New data
  const accounts = useLiveQuery(() => db.accounts.toArray());
  const cashFlow = useLiveQuery(() => db.cashFlow.toArray());
  const partners = useLiveQuery(() => db.partners.toArray());
  const journalEntries = useLiveQuery(() => db.journalEntries.toArray());
  const assets = useLiveQuery(() => db.assets.toArray());
  
  // Transaction State (Legacy)
  const [amount, setAmount] = useState('');
  const [discount, setDiscount] = useState('0');
  const [type, setType] = useState('income');
  const [description, setDescription] = useState('');

  // Cash Flow State
  const [cfAmount, setCfAmount] = useState('');
  const [cfDiscount, setCfDiscount] = useState('0');
  const [cfType, setCfType] = useState('receipt');
  const [cfDescription, setCfDescription] = useState('');
  const [cfPartnerId, setCfPartnerId] = useState('');
  const [cfEntityType, setCfEntityType] = useState('customer'); // customer, supplier, employee, other

  const employees = useLiveQuery(() => db.employees.toArray());

  // Account State
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState('cash');

  // Asset State
  const [assetName, setAssetName] = useState('');
  const [assetValue, setAssetValue] = useState('');
  const [assetDepRate, setAssetDepRate] = useState('');

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    
    const finalAmount = Number(amount) - Number(discount);
    await db.transactions.add({
      date: new Date().toISOString(),
      amount: finalAmount,
      type,
      description: `${description} (خصم: ${discount})`
    });

    setAmount('');
    setDiscount('0');
    setDescription('');
  };

  const deleteTransaction = async (id: number) => {
    await db.transactions.delete(id);
  };

  const handleAddCashFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfAmount || !cfDescription) return;

    const finalAmount = Number(cfAmount) - Number(cfDiscount);

    await db.cashFlow.add({
      date: new Date().toISOString(),
      amount: finalAmount,
      type: cfType,
      description: `${cfDescription} (خصم: ${cfDiscount})`,
      partnerId: cfPartnerId ? Number(cfPartnerId) : undefined
    });

    if (cfPartnerId) {
      const partner = await db.partners.get(Number(cfPartnerId));
      if (partner) {
        let balanceChange = 0;
        if (partner.type === 'customer') {
          balanceChange = cfType === 'receipt' ? -finalAmount : finalAmount;
        } else {
          balanceChange = cfType === 'payment' ? -finalAmount : finalAmount;
        }
        await db.partners.update(Number(cfPartnerId), {
          balance: partner.balance + balanceChange
        });
      }
    }

    await db.logs.add({
      action: cfType === 'receipt' ? 'سند قبض' : 'سند صرف',
      date: new Date().toISOString(),
      details: `المبلغ: ${finalAmount} (خصم: ${cfDiscount}) - البيان: ${cfDescription}`
    });

    setCfAmount('');
    setCfDiscount('0');
    setCfDescription('');
    setCfPartnerId('');
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName) return;

    await db.accounts.add({
      name: accName,
      type: accType,
      balance: 0
    });

    setAccName('');
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !assetValue || !assetDepRate) return;

    await db.assets.add({
      name: assetName,
      purchaseDate: new Date().toISOString(),
      purchaseValue: Number(assetValue),
      depreciationRate: Number(assetDepRate),
      currentBookValue: Number(assetValue)
    });

    setAssetName('');
    setAssetValue('');
    setAssetDepRate('');
  };

  const totalIncome = transactions?.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) || 0;
  const totalExpense = transactions?.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0) || 0;
  const totalSales = sales?.filter(s => s.type === 'sale').reduce((acc, s) => acc + s.total, 0) || 0;
  const totalPurchases = sales?.filter(s => s.type === 'purchase').reduce((acc, s) => acc + s.total, 0) || 0;

  const netProfit = (totalSales + totalIncome) - (totalPurchases + totalExpense);

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 p-4 rounded-lg border-r-4 border-indigo-600 mb-4">
        <h3 className="text-lg font-bold text-indigo-900">الحسابات والمالية (Accounts & Finance)</h3>
        <p className="text-sm text-indigo-700">إدارة الحسابات البنكية والخزائن، تسجيل سندات القبض والصرف، متابعة الأصول الثابتة، وإصدار قوائم الأرباح والخسائر.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        <button onClick={() => setTab('transactions')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${tab === 'transactions' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>الحركات المالية (سريع)</button>
        <button onClick={() => setTab('pnl')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${tab === 'pnl' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>الأرباح والخسائر</button>
        <button onClick={() => setTab('cashflow')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${tab === 'cashflow' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Wallet size={18} /> سندات القبض والصرف</button>
        <button onClick={() => setTab('accounts')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${tab === 'accounts' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><FileText size={18} /> شجرة الحسابات</button>
        <button onClick={() => setTab('assets')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${tab === 'assets' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Building2 size={18} /> الأصول الثابتة</button>
      </div>

      {tab === 'transactions' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-green-800 font-bold">إجمالي الإيرادات</h3>
              <p className="text-2xl font-bold text-green-600" dir="ltr">{totalIncome}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="text-red-800 font-bold">إجمالي المصروفات</h3>
              <p className="text-2xl font-bold text-red-600" dir="ltr">{totalExpense}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-blue-800 font-bold">الرصيد الحالي</h3>
              <p className="text-2xl font-bold text-blue-600" dir="ltr">{totalIncome - totalExpense}</p>
            </div>
          </div>

          <form onSubmit={addTransaction} className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
                <option value="income">إيراد</option>
                <option value="expense">مصروف</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الخصم</label>
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البيان</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors">
              تسجيل
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">التاريخ</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">النوع</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">البيان</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">المبلغ</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {transactions?.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b text-sm" dir="ltr">{new Date(t.date).toLocaleString('ar-EG')}</td>
                    <td className="py-3 px-4 border-b text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {t.type === 'income' ? 'إيراد' : 'مصروف'}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b text-sm">{t.description}</td>
                    <td className="py-3 px-4 border-b text-sm font-semibold" dir="ltr">{t.amount}</td>
                    <td className="py-3 px-4 border-b text-sm">
                      <button onClick={() => deleteTransaction(t.id)} className="text-red-600 hover:text-red-800">حذف</button>
                    </td>
                  </tr>
                ))}
                {transactions?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">لا يوجد حركات مالية</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'pnl' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-3xl mx-auto">
          <h3 className="text-xl font-bold mb-6 text-indigo-900 text-center">قائمة الأرباح والخسائر (P&L)</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 text-green-900 rounded-lg border border-green-200">
              <span className="font-bold">إجمالي المبيعات والإيرادات الأخرى:</span>
              <span className="text-xl font-bold" dir="ltr">{totalSales + totalIncome}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-red-50 text-red-900 rounded-lg border border-red-200">
              <span className="font-bold">إجمالي المشتريات والمصروفات:</span>
              <span className="text-xl font-bold" dir="ltr">{totalPurchases + totalExpense}</span>
            </div>
            
            <div className="h-px bg-gray-300 my-4"></div>
            
            <div className={`flex justify-between items-center p-6 rounded-xl text-2xl font-bold border ${netProfit >= 0 ? 'bg-indigo-100 text-indigo-900 border-indigo-200' : 'bg-rose-100 text-rose-900 border-rose-200'}`}>
              <span>صافي الربح / الخسارة:</span>
              <span dir="ltr">{netProfit}</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 text-center mt-6">
            يتم حساب صافي الربح بناءً على إجمالي المبيعات والإيرادات مطروحاً منه إجمالي المشتريات والمصروفات.
          </p>
        </div>
      )}

      {tab === 'cashflow' && (
        <div className="space-y-6">
          <form onSubmit={handleAddCashFlow} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">إضافة سند جديد</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع السند</label>
                <select value={cfType} onChange={(e) => setCfType(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="receipt">سند قبض (دخول نقد)</option>
                  <option value="payment">سند صرف (خروج نقد)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                <input type="number" value={cfAmount} onChange={(e) => setCfAmount(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الخصم</label>
                <input type="number" value={cfDiscount} onChange={(e) => setCfDiscount(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">جهة السند</label>
                <select value={cfEntityType} onChange={(e) => setCfEntityType(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="customer">عميل</option>
                  <option value="supplier">مورد</option>
                  <option value="employee">موظف</option>
                  <option value="company">شركة / جهة أخرى</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم المرتبط</label>
                <select value={cfPartnerId} onChange={(e) => setCfPartnerId(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">بدون تحديد</option>
                  {cfEntityType === 'employee' ? (
                    employees?.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))
                  ) : (
                    partners?.filter(p => p.type === cfEntityType || cfEntityType === 'company').map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.type === 'customer' ? 'عميل' : 'مورد'})</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البيان / الوصف</label>
                <input type="text" value={cfDescription} onChange={(e) => setCfDescription(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors font-bold flex items-center justify-center gap-2">
              <Plus size={20} /> حفظ السند
            </button>
          </form>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 border-b text-right font-semibold text-gray-600">التاريخ</th>
                  <th className="py-3 px-4 border-b text-right font-semibold text-gray-600">النوع</th>
                  <th className="py-3 px-4 border-b text-right font-semibold text-gray-600">المبلغ</th>
                  <th className="py-3 px-4 border-b text-right font-semibold text-gray-600">البيان</th>
                  <th className="py-3 px-4 border-b text-right font-semibold text-gray-600">المرتبط بـ</th>
                </tr>
              </thead>
              <tbody>
                {cashFlow?.slice().reverse().map((cf) => {
                  const partner = partners?.find(p => p.id === cf.partnerId);
                  return (
                    <tr key={cf.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b" dir="ltr">{new Date(cf.date).toLocaleString('ar-EG')}</td>
                      <td className="py-3 px-4 border-b">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${cf.type === 'receipt' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {cf.type === 'receipt' ? <><ArrowDownRight size={14}/> قبض</> : <><ArrowUpRight size={14}/> صرف</>}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b font-bold" dir="ltr">{cf.amount}</td>
                      <td className="py-3 px-4 border-b">{cf.description}</td>
                      <td className="py-3 px-4 border-b text-gray-600">{partner?.name || '-'}</td>
                    </tr>
                  );
                })}
                {(!cashFlow || cashFlow.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">لا توجد حركات مالية مسجلة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'accounts' && (
        <div className="space-y-6">
          <form onSubmit={handleAddAccount} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">إضافة حساب جديد</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الحساب</label>
                <input type="text" value={accName} onChange={(e) => setAccName(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الحساب</label>
                <select value={accType} onChange={(e) => setAccType(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="cash">خزينة نقدية</option>
                  <option value="bank">حساب بنكي</option>
                  <option value="expense">مصروفات</option>
                  <option value="revenue">إيرادات</option>
                  <option value="asset">أصول</option>
                  <option value="liability">خصوم</option>
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors font-bold flex items-center justify-center gap-2">
                  <Plus size={20} /> إضافة الحساب
                </button>
              </div>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts?.map(acc => (
              <div key={acc.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-800">{acc.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {acc.type === 'cash' ? 'خزينة' : 
                     acc.type === 'bank' ? 'بنك' : 
                     acc.type === 'expense' ? 'مصروف' : 
                     acc.type === 'revenue' ? 'إيراد' : 
                     acc.type === 'asset' ? 'أصل' : 'خصم'}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-500">الرصيد</p>
                  <p className="text-lg font-black text-indigo-600" dir="ltr">{acc.balance || 0}</p>
                </div>
              </div>
            ))}
            {(!accounts || accounts.length === 0) && (
              <div className="col-span-full py-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
                لا توجد حسابات مسجلة. قم بإضافة الخزينة والبنوك للبدء.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'assets' && (
        <div className="space-y-6">
          <form onSubmit={handleAddAsset} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">تسجيل أصل ثابت جديد</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الأصل</label>
                <input type="text" value={assetName} onChange={(e) => setAssetName(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">قيمة الشراء</label>
                <input type="number" value={assetValue} onChange={(e) => setAssetValue(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نسبة الإهلاك السنوي (%)</label>
                <input type="number" value={assetDepRate} onChange={(e) => setAssetDepRate(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors font-bold flex items-center justify-center gap-2">
                  <Plus size={20} /> تسجيل الأصل
                </button>
              </div>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">اسم الأصل</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">تاريخ الشراء</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">قيمة الشراء</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">نسبة الإهلاك</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">القيمة الدفترية الحالية</th>
                </tr>
              </thead>
              <tbody>
                {assets?.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b font-bold">{asset.name}</td>
                    <td className="py-3 px-4 border-b text-sm" dir="ltr">{new Date(asset.purchaseDate).toLocaleDateString('ar-EG')}</td>
                    <td className="py-3 px-4 border-b text-sm" dir="ltr">{asset.purchaseValue}</td>
                    <td className="py-3 px-4 border-b text-sm" dir="ltr">{asset.depreciationRate}%</td>
                    <td className="py-3 px-4 border-b text-sm font-bold text-indigo-600" dir="ltr">{asset.currentBookValue}</td>
                  </tr>
                ))}
                {(!assets || assets.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">لا توجد أصول ثابتة مسجلة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
