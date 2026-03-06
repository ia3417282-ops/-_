import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2 } from 'lucide-react';

export default function Sales() {
  const sales = useLiveQuery(() => db.sales.toArray());
  const partners = useLiveQuery(() => db.partners.toArray());
  const inventory = useLiveQuery(() => db.inventory.toArray());
  
  const [total, setTotal] = useState('');
  const [tax, setTax] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [partnerId, setPartnerId] = useState('');
  const [type, setType] = useState('sale'); // sale or purchase
  
  // Items for the current transaction
  const [selectedItems, setSelectedItems] = useState<{itemId: number, quantity: number, price: number, name: string}[]>([]);
  const [currentItemId, setCurrentItemId] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');

  const handleAddItem = () => {
    if (!currentItemId || !currentQuantity || !currentPrice) return;
    
    const item = inventory?.find(i => i.id === Number(currentItemId));
    if (!item) return;

    const newItems = [...selectedItems, {
      itemId: Number(currentItemId),
      quantity: Number(currentQuantity),
      price: Number(currentPrice),
      name: item.name
    }];
    
    setSelectedItems(newItems);
    
    // Auto-update total
    const subtotal = newItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = subtotal * (Number(tax) / 100);
    const finalTotal = subtotal + taxAmount - Number(discount);
    setTotal(finalTotal.toString());

    setCurrentItemId('');
    setCurrentQuantity('');
    setCurrentPrice('');
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
    
    // Auto-update total
    const subtotal = newItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = subtotal * (Number(tax) / 100);
    const finalTotal = subtotal + taxAmount - Number(discount);
    setTotal(finalTotal.toString());
  };

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!total || !partnerId) {
      alert('يرجى إدخال الإجمالي واختيار العميل/المورد');
      return;
    }
    
    const partner = await db.partners.get(Number(partnerId));
    if (!partner) return;

    const transactionTotal = Number(total);

    // 1. Add Sale Record
    await db.sales.add({
      date: new Date().toISOString(),
      total: transactionTotal,
      tax: Number(tax),
      discount: Number(discount),
      partnerId: Number(partnerId),
      type,
      items: selectedItems
    });

    // 2. Update Partner Balance
    const balanceChange = type === 'sale' ? transactionTotal : -transactionTotal;
    await db.partners.update(Number(partnerId), {
      balance: partner.balance + balanceChange
    });

    // 3. Update Inventory Quantities
    for (const item of selectedItems) {
      const invItem = await db.inventory.get(item.itemId);
      if (invItem) {
        const qtyChange = type === 'sale' ? -item.quantity : item.quantity;
        await db.inventory.update(item.itemId, {
          quantity: invItem.quantity + qtyChange
        });
      }
    }

    // Reset form
    setTotal('');
    setTax('0');
    setDiscount('0');
    setPartnerId('');
    setSelectedItems([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 p-4 rounded-lg border-r-4 border-indigo-600 mb-4">
        <h3 className="text-lg font-bold text-indigo-900">المبيعات والمشتريات (Sales & Purchases)</h3>
        <p className="text-sm text-indigo-700">تسجيل عمليات البيع والشراء، تحديث أرصدة العملاء والموردين، وخصم/إضافة الكميات للمخزون تلقائياً.</p>
      </div>

      <form onSubmit={addTransaction} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
              <option value="sale">مبيعات (فاتورة)</option>
              <option value="purchase">مشتريات</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">العميل / المورد</label>
            <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required>
              <option value="">{partners?.length === 0 ? 'لا يوجد عملاء/موردين (أضف أولاً)' : 'اختر...'}</option>
              {partners?.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.type === 'customer' ? 'عميل' : 'مورد'})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الضريبة (%)</label>
            <input type="number" value={tax} onChange={(e) => setTax(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الخصم</label>
            <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الإجمالي الكلي</label>
            <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
        </div>

        {/* إضافة الأصناف للفاتورة */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-md font-bold text-indigo-900 mb-4">الأصناف (اختياري)</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الصنف</label>
              <select 
                value={currentItemId} 
                onChange={(e) => {
                  setCurrentItemId(e.target.value);
                  const item = inventory?.find(i => i.id === Number(e.target.value));
                  if (item) setCurrentPrice(item.price.toString());
                }} 
                className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">اختر الصنف...</option>
                {inventory?.map(i => (
                  <option key={i.id} value={i.id}>{i.name} (المتاح: {i.quantity})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
              <input type="number" min="1" value={currentQuantity} onChange={(e) => setCurrentQuantity(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
              <input type="number" min="0" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <button type="button" onClick={handleAddItem} className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded hover:bg-indigo-200 transition-colors flex items-center justify-center gap-2 font-bold">
              <Plus size={20} /> إضافة الصنف
            </button>
          </div>

          {/* قائمة الأصناف المضافة */}
          {selectedItems.length > 0 && (
            <div className="mt-4">
              <table className="min-w-full bg-white border border-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-3 border-b text-right">الصنف</th>
                    <th className="py-2 px-3 border-b text-right">الكمية</th>
                    <th className="py-2 px-3 border-b text-right">السعر</th>
                    <th className="py-2 px-3 border-b text-right">الإجمالي</th>
                    <th className="py-2 px-3 border-b text-center">حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-3">{item.name}</td>
                      <td className="py-2 px-3">{item.quantity}</td>
                      <td className="py-2 px-3">{item.price}</td>
                      <td className="py-2 px-3 font-bold">{item.quantity * item.price}</td>
                      <td className="py-2 px-3 text-center">
                        <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-bold text-lg shadow-md">
          تسجيل العملية وحفظ الفاتورة
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">التاريخ</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">النوع</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">العميل / المورد</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">عدد الأصناف</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {sales?.map((sale) => {
              const partner = partners?.find(p => p.id === sale.partnerId);
              return (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b text-sm" dir="ltr">{new Date(sale.date).toLocaleString('ar-EG')}</td>
                  <td className="py-3 px-4 border-b text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${sale.type === 'sale' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {sale.type === 'sale' ? 'مبيعات' : 'مشتريات'}
                    </span>
                  </td>
                  <td className="py-3 px-4 border-b text-sm font-bold">{partner?.name || 'غير معروف'}</td>
                  <td className="py-3 px-4 border-b text-sm">{sale.items?.length || 0} أصناف</td>
                  <td className="py-3 px-4 border-b text-sm font-black text-indigo-600" dir="ltr">{sale.total}</td>
                </tr>
              );
            })}
            {sales?.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">لا يوجد عمليات مسجلة</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
