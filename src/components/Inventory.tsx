import React, { useState, useMemo } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Plus, Search, AlertTriangle, Package, 
  Trash2, Filter, Download, ArrowUpRight 
} from 'lucide-react';

export default function Inventory() {
  const items = useLiveQuery(() => db.inventory.toArray());
  
  // حالات الإدخال
  const [name, setName] = useState('');
  const [category, setCategory] = useState('عام');
  const [unit, setUnit] = useState('قطعة');
  const [quantity, setQuantity] = useState('');
  const [minStock, setMinStock] = useState('10');
  const [costPrice, setCostPrice] = useState(''); // سعر التكلفة
  const [sellingPrice, setSellingPrice] = useState(''); // سعر البيع

  // البحث والفلترة
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('الكل');

  const categories = [
    'عام', 'مواد غذائية', 'مجمدات', 'إلكترونيات', 'منظفات', 'ملابس', 'أدوية', 'بناء', 'أخرى'
  ];

  const units = ['قطعة', 'درزن', 'كرتونة', 'كيلو جرام', 'لتر', 'متر'];

  // تصفية الأصناف بناءً على البحث والنوع
  const filteredItems = useMemo(() => {
    return items?.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'الكل' || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, filterCategory]);

  // حسابات إجمالية للمخزن
  const totalValue = useMemo(() => {
    return items?.reduce((acc, item) => acc + (item.quantity * (item.costPrice || item.price)), 0) || 0;
  }, [items]);

  const lowStockCount = items?.filter(i => i.quantity <= (i.minStock || 0)).length || 0;

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !sellingPrice) return;
    
    await db.inventory.add({
      name,
      category,
      unit,
      quantity: Number(quantity),
      minStock: Number(minStock),
      costPrice: Number(costPrice || 0),
      price: Number(sellingPrice), // السعر للبيع
      barcode: `BR-${Math.floor(Math.random() * 900000 + 100000)}`,
      lastUpdated: new Date().toISOString()
    });

    // إعادة ضبط النموذج
    setName('');
    setQuantity('');
    setCostPrice('');
    setSellingPrice('');
  };

  const deleteItem = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الصنف نهائياً؟')) {
      await db.inventory.delete(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* ملخص المخزون */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <p className="text-indigo-100 text-sm">إجمالي قيمة البضاعة</p>
            <h3 className="text-2xl font-black">{totalValue.toLocaleString()}</h3>
          </div>
          <Package size={40} className="opacity-30" />
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">عدد الأصناف</p>
            <h3 className="text-2xl font-black text-gray-800">{items?.length || 0}</h3>
          </div>
          <Filter size={40} className="text-gray-100" />
        </div>
        <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between ${lowStockCount > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
          <div>
            <p className={`${lowStockCount > 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold`}>نواقص المخزون</p>
            <h3 className={`text-2xl font-black ${lowStockCount > 0 ? 'text-red-700' : 'text-green-700'}`}>{lowStockCount}</h3>
          </div>
          <AlertTriangle size={40} className={lowStockCount > 0 ? 'text-red-200' : 'text-green-200'} />
        </div>
      </div>

      {/* نموذج الإضافة */}
      <form onSubmit={addItem} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2 text-indigo-900 font-bold border-b pb-2">
          <Plus size={20} /> إضافة صنف جديد للمخزن
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-gray-500 mb-1 block">اسم الصنف</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="مثال: زيت دوار الشمس 1 لتر" required />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">التصنيف</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded-lg">
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">الكمية الافتتاحية</label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-2 border rounded-lg" required />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">سعر التكلفة</label>
            <input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="0.00" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">سعر البيع</label>
            <input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="0.00" required />
          </div>
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md">
          حفظ الصنف في المخزن
        </button>
      </form>

      {/* البحث والجدول */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="ابحث باسم الصنف أو الباركود..." 
              className="w-full pr-10 pl-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 border rounded-xl bg-white text-sm font-medium"
          >
            <option value="الكل">كل التصنيفات</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-right">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase">الصنف</th>
                <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase">التصنيف</th>
                <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase">المخزون</th>
                <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase">التكلفة</th>
                <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase">البيع</th>
                <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase">الربح المتوقع</th>
                <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems?.map((item) => {
                const isLow = item.quantity <= (item.minStock || 0);
                const profit = (item.price - (item.costPrice || 0));
                
                return (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-800">{item.name}</div>
                      <div className="text-[10px] font-mono text-gray-400 uppercase">{item.barcode}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">{item.category}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`flex items-center gap-2 font-black ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>
                        {item.quantity}
                        {isLow && <AlertTriangle size={14} className="animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-gray-400">{item.unit}</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-sm text-gray-500">{item.costPrice?.toLocaleString() || '0'}</td>
                    <td className="py-4 px-6 font-mono text-sm font-bold text-indigo-600">{item.price?.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-xs text-green-600 font-bold">
                        <ArrowUpRight size={12} /> {profit.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => deleteItem(item.id)} 
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
