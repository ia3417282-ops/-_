import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2 } from 'lucide-react';

export default function Invoices() {
  const invoices = useLiveQuery(() => db.invoices.toArray());
  const partners = useLiveQuery(() => db.partners.toArray());
  const inventory = useLiveQuery(() => db.inventory.toArray());
  
  const [total, setTotal] = useState('');
  const [tax, setTax] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [partnerId, setPartnerId] = useState('');
  const [type, setType] = useState('sales_invoice');
  const [status, setStatus] = useState('unpaid');
  
  // Items for the current invoice
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

  const addInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!total || !partnerId) {
      alert('يرجى إدخال الإجمالي واختيار العميل/المورد');
      return;
    }
    
    await db.invoices.add({
      date: new Date().toISOString(),
      total: Number(total),
      tax: Number(tax),
      discount: Number(discount),
      partnerId: Number(partnerId),
      type,
      status,
      items: selectedItems
    });

    setTotal('');
    setTax('0');
    setDiscount('0');
    setPartnerId('');
    setSelectedItems([]);
    setStatus('unpaid');
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 p-4 rounded-lg border-r-4 border-indigo-600 mb-4">
        <h3 className="text-lg font-bold text-indigo-900">إدارة الفواتير (Invoices Management)</h3>
        <p className="text-sm text-indigo-700">إصدار فواتير المبيعات والمشتريات، الفواتير الضريبية، الإشعارات الدائنة والمدينة، ومتابعة حالات الدفع.</p>
      </div>

      <form onSubmit={addInvoice} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
              <option value="sales_invoice">فاتورة مبيعات</option>
              <option value="purchase_invoice">فاتورة مشتريات</option>
              <option value="proforma">فاتورة مبدئية (Proforma)</option>
              <option value="tax_invoice">فاتورة ضريبية</option>
              <option value="credit_note">إشعار دائن</option>
              <option value="debit_note">إشعار مدين</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500">
              <option value="unpaid">غير مدفوعة</option>
              <option value="paid">مدفوعة</option>
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
          <h3 className="text-md font-bold text-indigo-900 mb-4">أصناف الفاتورة (اختياري)</h3>
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
          إصدار فاتورة
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">التاريخ</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">النوع</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">العميل / المورد</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الحالة</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">عدد الأصناف</th>
              <th className="py-3 px-4 border-b text-right text-sm font-semibold text-gray-600">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {invoices?.map((inv) => {
              const partner = partners?.find(p => p.id === inv.partnerId);
              return (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b text-sm" dir="ltr">{new Date(inv.date).toLocaleString('ar-EG')}</td>
                  <td className="py-3 px-4 border-b text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${inv.type === 'sales_invoice' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {inv.type === 'sales_invoice' ? 'فاتورة مبيعات' : 'فاتورة مشتريات'}
                    </span>
                  </td>
                  <td className="py-3 px-4 border-b text-sm font-bold">{partner?.name || 'غير معروف'}</td>
                  <td className="py-3 px-4 border-b text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {inv.status === 'paid' ? 'مدفوعة' : 'غير مدفوعة'}
                    </span>
                  </td>
                  <td className="py-3 px-4 border-b text-sm">{inv.items?.length || 0} أصناف</td>
                  <td className="py-3 px-4 border-b text-sm font-black text-indigo-600" dir="ltr">{inv.total}</td>
                </tr>
              );
            })}
            {invoices?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">لا يوجد فواتير</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
