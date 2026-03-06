import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Wastage() {
  const wastage = useLiveQuery(() => db.wastage.toArray());
  const inventory = useLiveQuery(() => db.inventory.toArray());
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const addWastage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !quantity || !reason) return;
    
    const item = await db.inventory.get(Number(itemId));
    if (item) {
      // Deduct from inventory
      await db.inventory.update(item.id!, {
        quantity: item.quantity - Number(quantity)
      });
    }

    await db.wastage.add({
      date: new Date().toISOString(),
      itemId: Number(itemId),
      quantity: Number(quantity),
      reason
    });

    setItemId('');
    setQuantity('');
    setReason('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 p-4 rounded-lg border-r-4 border-indigo-600 mb-4">
        <h3 className="text-lg font-bold text-indigo-900">إدارة الهالك (Wastage Management)</h3>
        <p className="text-sm text-indigo-700">تسجيل الأصناف التالفة أو المفقودة، تحديد أسباب الهالك، وخصم الكميات من المخزون لضمان دقة الجرد.</p>
      </div>

      <form onSubmit={addWastage} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الصنف</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required>
            <option value="">{inventory?.length === 0 ? 'لا يوجد أصناف (أضف أولاً)' : 'اختر...'}</option>
            {inventory?.map(i => (
              <option key={i.id} value={i.id}>{i.name} (المتاح: {i.quantity})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الكمية التالفة</label>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">السبب</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required>
            <option value="">اختر السبب...</option>
            <option value="انتهاء الصلاحية">انتهاء الصلاحية</option>
            <option value="كسر / تلف مادي">كسر / تلف مادي</option>
            <option value="فقد / سرقة">فقد / سرقة</option>
            <option value="سوء جودة / عيب مصنعي">سوء جودة / عيب مصنعي</option>
            <option value="سوء تخزين">سوء تخزين</option>
            <option value="تلف أثناء النقل">تلف أثناء النقل</option>
            <option value="كوارث طبيعية / حريق">كوارث طبيعية / حريق</option>
            <option value="عينة مجانية / تجربة">عينة مجانية / تجربة</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors font-bold">
          تسجيل الهالك
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">التاريخ</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الصنف</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الكمية</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">السبب</th>
            </tr>
          </thead>
          <tbody>
            {wastage?.map((w) => {
              const item = inventory?.find(i => i.id === w.itemId);
              return (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b text-sm" dir="ltr">{new Date(w.date).toLocaleString('ar-EG')}</td>
                  <td className="py-3 px-4 border-b text-sm font-bold">{item?.name || 'غير معروف'}</td>
                  <td className="py-3 px-4 border-b text-sm font-black text-red-600">{w.quantity}</td>
                  <td className="py-3 px-4 border-b text-sm">{w.reason}</td>
                </tr>
              );
            })}
            {wastage?.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">لا يوجد هالك مسجل</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
