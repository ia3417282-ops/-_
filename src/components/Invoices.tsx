import React, { useState, useMemo } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Plus, Trash2, FileText, CheckCircle, 
  Clock, Receipt, Search, Printer, AlertCircle 
} from 'lucide-react';

export default function Invoices() {
  const invoices = useLiveQuery(() => db.invoices.orderBy('date').reverse().toArray());
  const partners = useLiveQuery(() => db.partners.toArray());
  const inventory = useLiveQuery(() => db.inventory.toArray());

  // حالات الفاتورة
  const [partnerId, setPartnerId] = useState('');
  const [type, setType] = useState('sales_invoice');
  const [status, setStatus] = useState('unpaid');
  const [taxPercent, setTaxPercent] = useState('0');
  const [discount, setDiscount] = useState('0');
  
  // الأصناف
  const [selectedItems, setSelectedItems] = useState<{itemId: number, quantity: number, price: number, name: string}[]>([]);
  const [currentItemId, setCurrentItemId] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('1');
  const [currentPrice, setCurrentPrice] = useState('');

  // الحسابات التلقائية (Memoized لسرعة الأداء)
  const totals = useMemo(() => {
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = subtotal * (Number(taxPercent) / 100);
    const finalTotal = subtotal + taxAmount - Number(discount);
    return { subtotal, taxAmount, finalTotal };
  }, [selectedItems, taxPercent, discount]);

  const handleAddItem = () => {
    if (!currentItemId || Number(currentQuantity) <= 0) return;
    const item = inventory?.find(i => i.id === Number(currentItemId));
    if (!item) return;

    setSelectedItems([...selectedItems, {
      itemId: item.id!,
      quantity: Number(currentQuantity),
      price: Number(currentPrice) || item.price,
      name: item.name
    }]);

    setCurrentItemId('');
    setCurrentQuantity('1');
    setCurrentPrice('');
  };

  const addInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId || selectedItems.length === 0) {
      alert('برجاء اختيار العميل وإضافة أصناف للفاتورة');
      return;
    }

    try {
      await db.transaction('rw', [db.invoices, db.inventory, db.partners, db.transactions], async () => {
        // 1. إضافة الفاتورة
        const invoiceId = await db.invoices.add({
          date: new Date().toISOString(),
          total: totals.finalTotal,
          tax: Number(taxPercent),
          discount: Number(discount),
          partnerId: Number(partnerId),
          type,
          status,
          items: selectedItems
        });

        // 2. تحديث المخزون (بيع = خصم، شراء = زيادة)
        for (const item of selectedItems) {
          const invItem = await db.inventory.get(item.itemId);
          if (invItem) {
            const newQty = type === 'sales_invoice' ? invItem.quantity - item.quantity : invItem.quantity + item.quantity;
            await db.inventory.update(item.itemId, { quantity: newQty });
          }
        }

        // 3. تحديث حساب الشريك (مديونية)
        const partner = await db.partners.get(Number(partnerId));
        if (partner) {
          const balanceChange = type === 'sales_invoice' ? totals.finalTotal : -totals.finalTotal;
          await db.partners.update(Number(partnerId), { balance: (partner.balance || 0) + balanceChange });
        }

        // 4. إذا كانت مدفوعة كاش، أضفها للخزينة
        if (status === 'paid') {
          await db.transactions.add({
            date: new Date().toISOString(),
            amount: totals.finalTotal,
            type: type === 'sales_invoice' ? 'income' : 'expense',
            category: 'فواتير',
            description: `دفعة فاتورة رقم ${invoiceId}`,
            referenceId: invoiceId as number
          });
        }
      });

      // تنظيف النموذج
      setSelectedItems([]);
      setPartnerId('');
      alert('تم إصدار الفاتورة وتحديث المخزون والحسابات بنجاح!');
    } catch (err) {
      console.error(err);
      alert('فشلت العملية، تأكد من صحة البيانات');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3">
            <Receipt size={32} /> الفواتير الذكية
          </h2>
          <p className="opacity-80">إصدار فواتير، مزامنة مخزون، وتحديث حسابات العملاء آلياً.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* قسم إنشاء الفاتورة */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={addInvoice} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">نوع العملية</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500">
                  <option value="sales_invoice">🛍️ فاتورة مبيعات</option>
                  <option value="purchase_invoice">📦 فاتورة مشتريات</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">العميل / المورد</label>
                <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="w-full p-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-indigo-500" required>
                  <option value="">اختر الاسم...</option>
                  {partners?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* محرك إضافة الأصناف */}
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-1">
                  <label className="text-xs font-bold text-indigo-700 mb-1 block">الصنف</label>
                  <select value={currentItemId} onChange={(e) => {
                    setCurrentItemId(e.target.value);
                    const item = inventory?.find(i => i.id === Number(e.target.value));
                    if (item) setCurrentPrice(item.price.toString());
                  }} className="w-full p-2 border rounded-lg">
                    <option value="">اختر...</option>
                    {inventory?.map(i => <option key={i.id} value={i.id}>{i.name} ({i.quantity})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-indigo-700 mb-1 block">الكمية</label>
                  <input type="number" value={currentQuantity} onChange={(e) => setCurrentQuantity(e.target.value)} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="text-xs font-bold text-indigo-700 mb-1 block">السعر</label>
                  <input type="number" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} className="w-full p-2 border rounded-lg" />
                </div>
                <button type="button" onClick={handleAddItem} className="bg-indigo-600 text-white p-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all">
                  <Plus size={18} /> إضافة
                </button>
              </div>

              {selectedItems.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-indigo-400 font-bold">
                        <th className="text-right pb-2">الصنف</th>
                        <th className="text-right pb-2">الكمية</th>
                        <th className="text-right pb-2">الإجمالي</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-indigo-50">
                          <td className="py-2 font-bold">{item.name}</td>
                          <td className="py-2">{item.quantity} × {item.price}</td>
                          <td className="py-2 font-black text-indigo-600">{(item.quantity * item.price).toLocaleString()}</td>
                          <td className="py-2 text-center">
                            <button onClick={() => {
                              const newItems = [...selectedItems];
                              newItems.splice(idx, 1);
                              setSelectedItems(newItems);
                            }} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-xl shadow-lg hover:shadow-indigo-200 transition-all">
              اعتماد الفاتورة نهائياً
            </button>
          </form>
        </div>

        {/* ملخص الفاتورة الجانبي */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
              <receipt size={18}/> ملخص مالي
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-500"><span>الإجمالي قبل الضريبة</span><b>{totals.subtotal.toLocaleString()}</b></div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 flex-1">الضريبة (%)</span>
                <input type="number" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} className="w-16 p-1 border rounded text-center font-bold" />
              </div>
              <div className="flex items-center gap-2 border-b pb-3">
                <span className="text-sm text-gray-500 flex-1">خصم مباشر</span>
                <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-16 p-1 border rounded text-center font-bold text-red-600" />
              </div>
              <div className="pt-2 flex justify-between items-center text-indigo-900">
                <span className="font-black text-xl">الصافي النهائي</span>
                <span className="text-3xl font-black">{totals.finalTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">حالة الدفع الآن</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStatus('paid')} className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 border transition-all ${status === 'paid' ? 'bg-green-600 border-green-600 text-white' : 'bg-white text-gray-400'}`}>
                  <CheckCircle size={16}/> مدفوعة
                </button>
                <button type="button" onClick={() => setStatus('unpaid')} className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-2 border transition-all ${status === 'unpaid' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white text-gray-400'}`}>
                  <Clock size={16}/> آجلة
                </button>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 items-start">
            <AlertCircle className="text-amber-600 shrink-0" size={20}/>
            <p className="text-xs text-amber-800 leading-relaxed">
              <b>تنبيه:</b> الفاتورة المدفوعة تظهر مباشرة في "الخزينة"، بينما الآجلة تزيد رصيد مديونية العميل.
            </p>
          </div>
        </div>
      </div>

      {/* جدول السجلات */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="font-bold text-gray-700">آخر الفواتير الصادرة</h3>
          <div className="relative">
            <Search className="absolute right-3 top-2 text-gray-400" size={16}/>
            <input type="text" placeholder="بحث برقم الفاتورة..." className="pr-9 pl-4 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold">
              <tr>
                <th className="px-6 py-3">التاريخ</th>
                <th className="px-6 py-3">النوع</th>
                <th className="px-6 py-3">الطرف الآخر</th>
                <th className="px-6 py-3">الحالة</th>
                <th className="px-6 py-3">القيمة</th>
                <th className="px-6 py-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices?.map(inv => {
                const partner = partners?.find(p => p.id === inv.partnerId);
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">{new Date(inv.date).toLocaleString('ar-EG')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${inv.type === 'sales_invoice' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {inv.type === 'sales_invoice' ? 'مبيعات' : 'مشتريات'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">{partner?.name || 'مجهول'}</td>
                    <td className="px-6 py-4">
                      {inv.status === 'paid' ? 
                        <span className="text-green-600 flex items-center gap-1 text-xs font-bold"><CheckCircle size={14}/> مدفوعة</span> : 
                        <span className="text-orange-500 flex items-center gap-1 text-xs font-bold"><Clock size={14}/> آجلة</span>
                      }
                    </td>
                    <td className="px-6 py-4 font-black text-indigo-700">{inv.total.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 text-gray-400 hover:text-indigo-600 transition-all"><Printer size={18}/></button>
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
