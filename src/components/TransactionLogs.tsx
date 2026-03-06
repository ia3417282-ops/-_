import React from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function TransactionLogs() {
  const logs = useLiveQuery(() => db.logs.toArray());

  return (
    <div className="space-y-6">
      <div className="mb-4 text-sm text-gray-500">
        سجل بجميع الحركات التي تمت على النظام للمراجعة والتدقيق.
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">التاريخ</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الإجراء</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b text-sm" dir="ltr">{new Date(log.date).toLocaleString('ar-EG')}</td>
                <td className="py-3 px-4 border-b text-sm font-semibold">{log.action}</td>
                <td className="py-3 px-4 border-b text-sm text-gray-600">{log.details}</td>
              </tr>
            ))}
            {logs?.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-gray-500">لا يوجد سجلات حتى الآن</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
