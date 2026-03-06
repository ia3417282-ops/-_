import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function CRM() {
  const [tab, setTab] = useState('directory');
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const partners = useLiveQuery(() => db.partners.toArray());
  
  // الحقول الأساسية
  const [name, setName] = useState('');
  const [type, setType] = useState('customer');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState('0');
  
  // الحقول الإضافية الجديدة
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [notes, setNotes] = useState('');

  const addPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    
    await db.partners.add({
      name,
      type,
      phone,
      balance: Number(balance),
      companyName,
      email,
      address,
      taxNumber,
      notes,
      createdAt: new Date().toISOString()
    });

    // تفريغ الحقول بعد الإضافة
    setName('');
    setPhone('');
    setBalance('0');
    setCompanyName('');
    setEmail('');
    setAddress('');
    setTaxNumber('');
    setNotes('');
  };

  const deletePartner = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      await db.partners.delete(id);
      if (selectedPartner?.id === id) {
        setTab('directory');
        setSelectedPartner(null);
      }
    }
  };

  const viewStatement = (partner: any) => {
    setSelectedPartner(partner);
    setTab('statement');
  };

  return (
    <div className="space-y-6">
      {/* التبويبات */}
      <div className="flex gap-4 border-b pb-2">
        <button 
          onClick={() => setTab('directory')} 
          className={`px-4 py-2 ${tab === 'directory' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500 hover:text-indigo-500'}`}
        >
          دليل الشركاء
        </button>
        {selectedPartner && (
          <button 
            onClick={() => setTab('statement')} 
            className={`px-4 py-2 ${tab === 'statement' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-500 hover:text-indigo-500'}`}
          >
            ملف وكشف حساب: {selectedPartner.name}
          </button>
        )}
      </div>

      {tab === 'directory' && (
        <>
          {/* نموذج الإضافة المطور */}
          <form onSubmit={addPartner} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">إضافة جهة جديدة</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* الصف الأول */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم (إلزامي) *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة / المؤسسة</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" />
              </div>

              {/* الصف الثاني */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف (إلزامي) *</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرقم الضريبي</label>
                <input type="text" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" />
              </div>

              {/* الصف الثالث */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرصيد الافتتاحي (ديون)</label>
                <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" />
              </div>

              {/* الصف الرابع */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات إضافية</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" rows={2} />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                حفظ البيانات
              </button>
            </div>
          </form>

          {/* الجدول */}
          <div className="overflow-x-auto rounded-lg shadow-sm">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 border-b text-right text-sm font-bold text-gray-700">الاسم</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-bold text-gray-700">الشركة</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-bold text-gray-700">النوع</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-bold text-gray-700">الهاتف</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-bold text-gray-700">الرصيد</th>
                  <th className="py-3 px-4 border-b text-right text-sm font-bold text-gray-700">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {partners?.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 border-b text-sm font-medium">{partner.name}</td>
                    <td className="py-3 px-4 border-b text-sm text-gray-600">{partner.companyName || '-'}</td>
                    <td className="py-3 px-4 border-b text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${partner.type === 'customer' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {partner.type === 'customer' ? 'عميل' : 'مورد'}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b text-sm">{partner.phone}</td>
                    <td className="py-3 px-4 border-b text-sm font-bold text-indigo-600" dir="ltr">{partner.balance}</td>
                    <td className="py-3 px-4 border-b text-sm">
                      <button onClick={() => viewStatement(partner)} className="bg-gray-100 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-100 ml-2 transition-colors">الملف وكشف الحساب</button>
                      <button onClick={() => deletePartner(partner.id)} className="bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100 transition-colors">حذف</button>
                    </td>
                  </tr>
                ))}
                {partners?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">لا يوجد عملاء أو موردين مسجلين حتى الآن</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* صفحة الملف الشخصي وكشف الحساب */}
      {tab === 'statement' && selectedPartner && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedPartner.name}</h3>
                <p className="text-gray-500 mt-1">{selectedPartner.companyName}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${selectedPartner.type === 'customer' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                {selectedPartner.type === 'customer' ? 'عميل' : 'مورد'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 md:col-span-2">
                <p className="text-sm text-indigo-600 mb-1 font-medium">الرصيد الحالي (المستحقات)</p>
                <span className="font-bold text-3xl text-indigo-900" dir="ltr">{selectedPartner.balance}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">رقم الهاتف</p>
                <span className="font-semibold">{selectedPartner.phone}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500 mb-1">الرقم الضريبي</p>
                <span className="font-semibold">{selectedPartner.taxNumber || 'غير مسجل'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div>
                <p className="text-sm text-gray-500 mb-1">البريد الإلكتروني</p>
                <p className="font-medium text-gray-800">{selectedPartner.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">العنوان</p>
                <p className="font-medium text-gray-800">{selectedPartner.address || '-'}</p>
              </div>
              <div className="md:col-span-2 mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-1">ملاحظات</p>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedPartner.notes || 'لا توجد ملاحظات'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
            <h4 className="text-lg font-bold text-gray-800 mb-2">سجل الحركات</h4>
            <p className="text-gray-500 mb-4">هنا سيتم عرض جدول بجميع فواتير المبيعات/المشتريات والدفعات المتعلقة بهذا الشريك قريباً.</p>
            <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg inline-block border border-blue-100">
              ملاحظة: يتم تحديث الرصيد تلقائياً عند تسجيل العمليات في أقسام المبيعات والمشتريات.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
