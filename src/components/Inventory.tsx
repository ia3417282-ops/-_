import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Inventory() {
  const items = useLiveQuery(() => db.inventory.toArray());
  const [name, setName] = useState('');
  const [category, setCategory] = useState('عام');
  const [unit, setUnit] = useState('قطعة');
  const [quantity, setQuantity] = useState('');
  const [minStock, setMinStock] = useState('10');
  const [price, setPrice] = useState('');

  const categories = [
    'عام', 'مواد غذائية', 'مجمدات', 'معلبات', 'مشروبات غازية', 'عصائر وألبان', 'مخبوزات',
    'لحوم ودواجن', 'أسماك ومأكولات بحرية', 'خضروات وفواكه', 'بقوليات وحبوب', 'زيوت ودهون',
    'توابل وبهارات', 'حلويات وتسالي', 'منظفات منزلية', 'أدوات نظافة', 'عناية شخصية',
    'إلكترونيات وهواتف', 'أجهزة منزلية', 'أدوات مكتبية وقرطاسية', 'أثاث منزلي', 'أثاث مكتبي',
    'ملابس رجالي', 'ملابس حريمي', 'ملابس أطفال', 'أحذية وحقائب', 'أدوية ومستلزمات طبية',
    'مستحضرات تجميل', 'عطور وبخور', 'قطع غيار سيارات', 'قطع غيار إلكترونية', 'أدوات كهربائية',
    'مواد بناء (أسمنت/حديد)', 'أدوات سباكة', 'أدوات نجارة', 'دهانات وأصباغ', 'ألعاب أطفال',
    'مستلزمات حيوانات أليفة', 'خدمات استشارية', 'خدمات صيانة', 'أصول ثابتة', 'أخرى'
  ];

  const units = [
    'قطعة', 'درزن (12 قطعة)', 'كرتونة', 'صندوق', 'رزمة', 'كيس', 'علبة', 'برطمان',
    'كيلو جرام', 'جرام', 'ملي جرام', 'طن', 'لتر', 'ملي لتر', 'جالون',
    'متر طولي', 'متر مربع', 'متر مكعب', 'سم', 'بوصة', 'قدم',
    'ساعة عمل', 'يوم عمل', 'أسبوع', 'شهر', 'زيارة', 'خدمة'
  ];

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !price) return;
    await db.inventory.add({
      name,
      category,
      unit,
      quantity: Number(quantity),
      minStock: Number(minStock),
      price: Number(price),
      barcode: Math.random().toString(36).substring(2, 10).toUpperCase(),
      expiryDate: null
    });
    setName('');
    setCategory('عام');
    setUnit('قطعة');
    setQuantity('');
    setMinStock('10');
    setPrice('');
  };

  const deleteItem = async (id: number) => {
    await db.inventory.delete(id);
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 p-4 rounded-lg border-r-4 border-indigo-600 mb-4">
        <h3 className="text-lg font-bold text-indigo-900">إدارة المخزون (Inventory)</h3>
        <p className="text-sm text-indigo-700">تتبع الأصناف، الكميات المتوفرة، تنبيهات النواقص، وإدارة التصنيفات ووحدات القياس المختلفة.</p>
      </div>

      <form onSubmit={addItem} className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم الصنف</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">وحدة القياس</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأدنى</label>
          <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
        </div>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors md:col-span-6">إضافة صنف</button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الباركود</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الاسم</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">التصنيف</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الكمية</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">السعر</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b text-sm font-mono text-gray-500">{item.barcode}</td>
                <td className="py-3 px-4 border-b text-sm">{item.name}</td>
                <td className="py-3 px-4 border-b text-sm">
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">{item.category || 'عام'}</span>
                </td>
                <td className="py-3 px-4 border-b text-sm">
                  <span className={`font-semibold ${item.quantity <= (item.minStock || 10) ? 'text-red-600 bg-red-50 px-2 py-1 rounded' : 'text-green-600'}`}>
                    {item.quantity} {item.unit || 'قطعة'}
                  </span>
                  {item.quantity <= (item.minStock || 10) && (
                    <span className="text-xs text-red-500 block mt-1">يجب إعادة الطلب</span>
                  )}
                </td>
                <td className="py-3 px-4 border-b text-sm" dir="ltr">{item.price}</td>
                <td className="py-3 px-4 border-b text-sm">
                  <button onClick={() => deleteItem(item.id)} className="text-red-600 hover:text-red-800">حذف</button>
                </td>
              </tr>
            ))}
            {items?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">لا يوجد أصناف في المخزون</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
