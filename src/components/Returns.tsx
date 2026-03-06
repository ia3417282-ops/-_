import React, { useState, useMemo } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, RotateCcw, AlertTriangle, CheckCircle, Hash } from 'lucide-react';

export default function Returns() {
  const returns = useLiveQuery(() => db.returns.orderBy('date').reverse().toArray());
  const partners = useLiveQuery(() => db.partners.toArray());
  const inventory = useLiveQuery(() => db.inventory.toArray());
  
  // الحقول الأساسية للمرتجع
  const [partnerId, setPartnerId] = useState('');
  const [type, setType] = useState('sales_return');
  const [invoiceRef, setInvoiceRef] = useState(''); // رقم الفاتورة الأصلية
  const [returnReason, setReturnReason] = useState('');
  const [discount, setDiscount] = useState('0');
  
  // الأصناف داخل المرتجع
  const [selectedItems, setSelectedItems] = useState<{itemId: number, quantity: number, price: number, name: string, condition: string}[]>([]);
  const [currentItemId, setCurrentItemId] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [currentCondition, setCurrentCondition] = useState('good'); // جيد أم تالف

  // حساب الإجمالي تلقائياً
  const subtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }, [selectedItems]);

  const finalTotal = subtotal - Number(discount);

  const handleAddItem = () => {
    if (!currentItemId || !currentQuantity || !currentPrice) return;
    
    const item = inventory?.find(i => i.id === Number(currentItemId));
    if (!item) return;

    setSelectedItems([...selectedItems, {
      itemId: Number(currentItemId),
      quantity: Number(currentQuantity),
      price: Number(currentPrice),
      name: item.name,
      condition: currentCondition
    }]);

    setCurrentItemId('');
    setCurrentQuantity('');
    setCurrentPrice('');
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const addReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0 || !partnerId) {
      alert('يرجى إضافة أصناف واختيار العميل/المورد');
      return;
    }
    
    const partner = await db.partners.get(Number(partnerId));
    if (!partner) return;

    try {
      // تنفيذ العملية داخل Transaction لضمان سلامة البيانات
      await db.transaction('rw', [db.returns, db.partners, db.inventory], async () => {
        // 1. تسجيل عملية المرتجع
        await db.returns.add({
          date: new Date().toISOString(),
          total: finalTotal,
          subtotal,
          discount: Number(discount),
          partnerId: Number(partnerId),
          type,
          invoiceRef,
          reason: returnReason,
          items: selectedItems
        });

        // 2. تحديث رصيد الشريك
        // مرتجع مبيعات: العميل رجع بضاعة -> رصيده (ديونه) يقل
        // مرتجع مشتريات: إحنا رجعنا للمورد -> رصيده عندنا يقل
        const balanceChange = type === 'sales_return' ? -finalTotal : finalTotal;
        await db.partners.update(Number(partnerId), {
          balance: (partner.balance || 0) + balanceChange
        });

        // 3. تحديث المخزون (فقط إذا كان الصنف بحالة جيدة)
        for (const item of selectedItems) {
          if (item.condition === 'good') {
            const invItem = await db.inventory.get(item.itemId);
            if (invItem) {
              const qtyChange = type === 'sales_return' ? item.quantity : -item.quantity;
              await db.inventory.update(item.itemId, {
                quantity: invItem.quantity + qtyChange
              });
            }
          }
        }
      });

      // تنظيف النموذج
      setPartnerId('');
      setInvoiceRef('');
      setReturnReason('');
      setDiscount('0');
      setSelectedItems([]);
      alert('تم تسجيل المرتجع وتحديث الأرصدة والمخزون بنجاح');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء تسجيل العملية');
    }
  };

  return (
    <div className="space-y-6">
      {/* هيدر القسم */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-400 p-6 rounded-xl text-white shadow-lg flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <RotateCcw size={28} /> إدارة المرتجعات الاحترافية
          </h3>
          <p className="opacity-90 mt-1 text-sm">إرجاع مبيعات، مشتريات، ومعالجة الأصناف التالفة</p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-xs opacity-75">إجمالي المرتجعات المسجلة</p>
          <p className="text-2xl font-black">{returns?.length || 0}</p>
        </div>
      </div>

      <form onSubmit={addReturn} className="bg-white p-6 rounded-xl shadow-md border border-gray-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">نوع المرتجع</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500">
              <option value="sales_return">🔙 مرتجع مبيعات (داخل)</option>
              <option value="purchase_return">📤 مرتجع مشتريات (خارج)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">العميل / المورد</label>
            <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500" required>
              <option value="">اختر الاسم...</option>
              {partners?.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.type === 'customer' ? 'عميل' : 'مورد'})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
              <Hash size={14} /> رقم الفاتورة المرجعي
            </label>
            <input type="text" value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="مثال: INV-1002" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">سبب المرتجع</label>
            <input type="text" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="خطأ في الصنف، تلف..." />
          </div>
        </div>

        {/* منطقة إضافة الأصناف */}
        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
          <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
            <Plus size={18} /> إضافة الأصناف المرتجعة
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-orange-700 mb-1">الصنف</label>
              <select 
                value={currentItemId} 
                onChange={(e) => {
                  setCurrentItemId(e.target.value);
                  const item = inventory?.find(i => i.id === Number(e.target.value));
                  if (item) setCurrentPrice(item.price.toString());
                }} 
                className="w-full p-2 border rounded-md focus:ring-orange-500"
              >
                <option value="">اختر صنفاً...</option>
                {inventory?.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-orange-700 mb-1">الكمية</label>
              <input type="number" value={currentQuantity} onChange={(e) => setCurrentQuantity(e.target.value)} className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-xs font-bold text-orange-700 mb-1">السعر</label>
              <input type="number" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-xs font-bold text-orange-700 mb-1">حالة الصنف</label>
              <select value={currentCondition} onChange={(e) => setCurrentCondition(e.target.value)} className="w-full p-2 border rounded-md">
                <option value="good">صالح للبيع (يعود للمخزن)</option>
                <option value="damaged">تالف (لا يعود للمخزن)</option>
              </select>
            </div>
            <button type="button" onClick={handleAddItem} className="bg-orange-600 text-white p-2 rounded-md font-bold hover:bg-orange-700">إضافة</button>
          </div>

          {/* معاينة الأصناف المضافة */}
          {selectedItems.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-lg border border-orange-200">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-orange-100 text-orange-800">
                  <tr>
                    <th className="p-2 text-right">الصنف</th>
                    <th className="p-2 text-right">الكمية</th>
                    <th className="p-2 text-right">السعر</th>
                    <th className="p-2 text-right">الحالة</th>
                    <th className="p-2 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item, index) => (
                    <tr key={index} className="border-t border-orange-50">
                      <td className="p-2">{item.name}</td>
                      <td className="p-2 font-bold">{item.quantity}</td>
                      <td className="p-2">{item.price}</td>
                      <td className="p-2 text-xs">
                        {item.condition === 'good' ? 
                          <span className="text-green-600 flex items-center gap-1"><CheckCircle size={12}/> جيد</span> : 
                          <span className="text-red-600 flex items-center gap-1"><AlertTriangle size={12}/> تالف</span>
                        }
                      </td>
                      <td className="p-2 text-center">
                        <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* الملخص المالي */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">خصم المرتجع</label>
            <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full p-2.5 border rounded-lg" />
          </div>
          <div className="md:col-span-2 flex items-center justify-end gap-6">
            <div className="text-right">
              <p className="text-sm text-gray-500">الإجمالي قبل الخصم</p>
              <p className="text-xl font-bold">{subtotal.toLocaleString()}</p>
            </div>
            <div className="text-right bg-orange-600 text-white p-3 rounded-lg shadow-inner">
              <p className="text-xs opacity-80 font-bold">الصافي النهائي</p>
              <p className="text-3xl font-black">{finalTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-xl hover:bg-orange-700 transition-all font-black text-xl shadow-lg flex items-center justify-center gap-3">
          <RotateCcw /> اعتماد المرتجع وتحديث الحسابات
        </button>
      </form>

      {/* سجل المرتجعات */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-100 border-b font-bold text-gray-700">آخر المرتجعات المسجلة</div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 border-b text-right text-xs font-bold text-gray-500">التاريخ</th>
                <th className="py-3 px-4 border-b text-right text-xs font-bold text-gray-500">النوع</th>
                <th className="py-3 px-4 border-b text-right text-xs font-bold text-gray-500">الطرف الآخر</th>
                <th className="py-3 px-4 border-b text-right text-xs font-bold text-gray-500">رقم الفاتورة</th>
                <th className="py-3 px-4 border-b text-right text-xs font-bold text-gray-500">القيمة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {returns?.map((ret) => {
                const partner = partners?.find(p => p.id === ret.partnerId);
                return (
                  <tr key={ret.id} className="hover:bg-orange-50 transition-colors">
                    <td className="py-3 px-4 text-xs font-mono text-gray-500">{new Date(ret.date).toLocaleString('ar-EG')}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black ${ret.type === 'sales_return' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {ret.type === 'sales_return' ? 'مرتجع مبيعات' : 'مرتجع مشتريات'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-gray-800">{partner?.name || '---'}</td>
                    <td className="py-3 px-4 text-sm font-mono text-orange-600">{ret.invoiceRef || 'بدون'}</td>
                    <td className="py-3 px-4 text-sm font-black text-gray-900">{ret.total?.toLocaleString()}</td>
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
