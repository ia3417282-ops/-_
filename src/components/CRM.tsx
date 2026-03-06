import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function CRM() {
  const [tab, setTab] = useState('directory');
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const partners = useLiveQuery(() => db.partners.toArray());
  
  const [name, setName] = useState('');
  const [type, setType] = useState('customer');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState('0');

  const addPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    await db.partners.add({
      name,
      type,
      phone,
      balance: Number(balance)
    });
    setName('');
    setPhone('');
    setBalance('0');
  };

  const deletePartner = async (id: number) => {
    await db.partners.delete(id);
  };

  const viewStatement = (partner: any) => {
    setSelectedPartner(partner);
    setTab('statement');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b pb-2">
        <button onClick={() => setTab('directory')} className={`px-4 py-2 ${tab === 'directory' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500'}`}>دليل الشركاء</button>
        {selectedPartner && (
          <button onClick={() => setTab('statement')} className={`px-4 py-2 ${tab === 'statement' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500'}`}>
            كشف حساب: {selectedPartner.name}
          </button>
        )}
      </div>

      {tab === 'directory' && (
        <>
          <form onSubmit={addPartner} className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
                <option value="customer">عميل</option>
                <option value="supplier">مورد</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الرصيد الافتتاحي</label>
              <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors">إضافة</button>
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الاسم</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">النوع</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">رقم الهاتف</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الرصيد</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {partners?.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b text-sm">{partner.name}</td>
                    <td className="py-3 px-4 border-b text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${partner.type === 'customer' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {partner.type === 'customer' ? 'عميل' : 'مورد'}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b text-sm">{partner.phone}</td>
                    <td className="py-3 px-4 border-b text-sm font-bold" dir="ltr">{partner.balance}</td>
                    <td className="py-3 px-4 border-b text-sm">
                      <button onClick={() => viewStatement(partner)} className="text-indigo-600 hover:text-indigo-800 ml-3">كشف حساب</button>
                      <button onClick={() => deletePartner(partner.id)} className="text-red-600 hover:text-red-800">حذف</button>
                    </td>
                  </tr>
                ))}
                {partners?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">لا يوجد عملاء أو موردين مسجلين</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'statement' && selectedPartner && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold mb-6 text-indigo-900">كشف حساب: {selectedPartner.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">الرصيد الحالي (الديون)</p>
              <span className="font-bold text-2xl text-indigo-600" dir="ltr">{selectedPartner.balance}</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">رقم الهاتف</p>
              <span className="font-bold text-lg">{selectedPartner.phone}</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">النوع</p>
              <span className="font-bold text-lg">{selectedPartner.type === 'customer' ? 'عميل' : 'مورد'}</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded text-blue-800 border border-blue-100">
            ملاحظة: يتم تحديث الرصيد تلقائياً عند تسجيل المبيعات أو المشتريات أو المرتجعات في الأقسام المخصصة.
          </p>
        </div>
      )}
    </div>
  );
}
