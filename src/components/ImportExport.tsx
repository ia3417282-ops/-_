import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function ImportExport() {
  const records = useLiveQuery(() => db.importExport.toArray());
  const [type, setType] = useState('import');
  const [entityType, setEntityType] = useState('company');
  const [entityName, setEntityName] = useState('');
  const [details, setDetails] = useState('');

  const addRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details || !entityName) return;
    await db.importExport.add({
      date: new Date().toISOString(),
      type,
      entityType,
      entityName,
      details
    });
    setEntityName('');
    setDetails('');
  };

  const deleteRecord = async (id: number) => {
    await db.importExport.delete(id);
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

  return (
    <div className="space-y-6">
      <form onSubmit={addRecord} className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">العملية</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
            <option value="import">استيراد (من)</option>
            <option value="export">تصدير (إلى)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نوع الجهة</label>
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
            <option value="company">شركة</option>
            <option value="office">مكتب</option>
            <option value="distributor">موزع</option>
            <option value="supplier">مورد</option>
            <option value="customer">عميل</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم الجهة</label>
          <input type="text" value={entityName} onChange={(e) => setEntityName(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required placeholder="مثال: شركة الأمل" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">التفاصيل / الشحنة</label>
          <input type="text" value={details} onChange={(e) => setDetails(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
        </div>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors">تسجيل</button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">التاريخ</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">العملية</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الجهة</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">التفاصيل</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {records?.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b text-sm" dir="ltr">{new Date(record.date).toLocaleString('ar-EG')}</td>
                <td className="py-3 px-4 border-b text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${record.type === 'import' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {record.type === 'import' ? 'استيراد' : 'تصدير'}
                  </span>
                </td>
                <td className="py-3 px-4 border-b text-sm">
                  <span className="text-gray-500 text-xs ml-1">({getEntityTypeName(record.entityType || 'company')})</span>
                  <span className="font-semibold">{record.entityName || '-'}</span>
                </td>
                <td className="py-3 px-4 border-b text-sm">{record.details}</td>
                <td className="py-3 px-4 border-b text-sm">
                  <button onClick={() => deleteRecord(record.id)} className="text-red-600 hover:text-red-800">حذف</button>
                </td>
              </tr>
            ))}
            {records?.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">لا يوجد سجلات</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
