import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function ImportExport() {
  const records = useLiveQuery(() => db.importExport.orderBy('date').reverse().toArray());
  
  // الحقول الأساسية
  const [type, setType] = useState('import');
  const [entityType, setEntityType] = useState('company');
  const [entityName, setEntityName] = useState('');
  const [details, setDetails] = useState('');
  
  // الحقول الجديدة المضافة للاحترافية
  const [shipmentNo, setShipmentNo] = useState(''); // رقم الشحنة / البوليصة
  const [value, setValue] = useState('0'); // قيمة الشحنة المالية
  const [shippingMethod, setShippingMethod] = useState('sea'); // بحري، جوي، بري
  const [status, setStatus] = useState('pending'); // قيد الشحن، تم الاستلام، في الجمارك

  const addRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details || !entityName) return;

    await db.importExport.add({
      date: new Date().toISOString(),
      type,
      entityType,
      entityName,
      details,
      shipmentNo,
      value: Number(value),
      shippingMethod,
      status,
    });

    // إعادة ضبط الحقول
    setEntityName('');
    setDetails('');
    setShipmentNo('');
    setValue('0');
  };

  const deleteRecord = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف سجل هذه الشحنة؟')) {
      await db.importExport.delete(id);
    }
  };

  const getEntityTypeName = (type: string) => {
    const types: Record<string, string> = {
      office: 'مكتب',
      company: 'شركة',
      distributor: 'موزع',
      customer: 'عميل',
      supplier: 'مورد'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      pending: { label: 'قيد الشحن', color: 'bg-yellow-100 text-yellow-800' },
      received: { label: 'تم الاستلام', color: 'bg-green-100 text-green-800' },
      customs: { label: 'في الجمارك', color: 'bg-orange-100 text-orange-800' },
      cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800' }
    };
    const item = statusMap[status] || statusMap.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.color}`}>{item.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* نموذج إضافة شحنة مطور */}
      <form onSubmit={addRecord} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-indigo-900 border-b pb-2">تسجيل حركة شحن جديدة</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نوع العملية</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500">
              <option value="import">📥 استيراد (وارد)</option>
              <option value="export">📤 تصدير (صادر)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الجهة</label>
            <input type="text" value={entityName} onChange={(e) => setEntityName(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="اسم الشركة أو المورد" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الشحنة / البوليصة</label>
            <input type="text" value={shipmentNo} onChange={(e) => setShipmentNo(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Bill of Lading" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القيمة المالية</label>
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الشحن</label>
            <select value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="sea">🚢 بحري</option>
              <option value="air">✈️ جوي</option>
              <option value="land">🚛 بري</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="pending">قيد الشحن</option>
              <option value="customs">في الجمارك</option>
              <option value="received">تم الاستلام</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">تفاصيل المحتوى</label>
            <input type="text" value={details} onChange={(e) => setDetails(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="ماذا يوجد داخل الشحنة؟" required />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md">
            تسجيل الحركة
          </button>
        </div>
      </form>

      {/* جدول السجلات المطور */}
      <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200">
        <table className="min-w-full bg-white">
          <thead className="bg-indigo-50">
            <tr>
              <th className="py-3 px-4 border-b text-right text-sm font-bold text-indigo-900">التاريخ</th>
              <th className="py-3 px-4 border-b text-right text-sm font-bold text-indigo-900">النوع</th>
              <th className="py-3 px-4 border-b text-right text-sm font-bold text-indigo-900">الجهة</th>
              <th className="py-3 px-4 border-b text-right text-sm font-bold text-indigo-900">رقم الشحنة</th>
              <th className="py-3 px-4 border-b text-right text-sm font-bold text-indigo-900">المحتوى</th>
              <th className="py-3 px-4 border-b text-right text-sm font-bold text-indigo-900">الحالة</th>
              <th className="py-3 px-4 border-b text-right text-sm font-bold text-indigo-900">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records?.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-xs text-gray-500 font-mono">
                  {new Date(record.date).toLocaleDateString('ar-EG')}
                </td>
                <td className="py-3 px-4">
                  <span className={`flex items-center w-fit gap-1 px-2 py-1 rounded font-bold text-xs ${record.type === 'import' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {record.type === 'import' ? '📥 استيراد' : '📤 تصدير'}
                  </span>
                </td>
                <td className="py-3 px-4 border-b">
                  <div className="text-sm font-bold text-gray-800">{record.entityName}</div>
                  <div className="text-[10px] text-gray-400">{getEntityTypeName(record.entityType)}</div>
                </td>
                <td className="py-3 px-4 text-sm font-mono text-gray-600">{record.shipmentNo || '---'}</td>
                <td className="py-3 px-4 text-sm text-gray-700 max-w-xs truncate">{record.details}</td>
                <td className="py-3 px-4">{getStatusBadge(record.status)}</td>
                <td className="py-3 px-4 text-sm">
                  <button 
                    onClick={() => deleteRecord(record.id)} 
                    className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-full transition-all"
                    title="حذف السجل"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {records?.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                  لا توجد عمليات استيراد أو تصدير مسجلة حالياً
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
