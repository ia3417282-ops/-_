import React, { useState } from 'react';
import * as math from 'mathjs';
import { Calculator as CalcIcon, DollarSign, Percent, ArrowRightLeft, FunctionSquare } from 'lucide-react';

export default function Calculator() {
  const [activeTab, setActiveTab] = useState('math');

  // Math Calculator State
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');

  // Pricing Calculator State
  const [costPrice, setCostPrice] = useState('');
  const [targetMargin, setTargetMargin] = useState('');
  const [taxRate, setTaxRate] = useState('15');
  
  // Currency Converter State
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('SAR');
  const [toCurrency, setToCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState('0.27'); // Example rate

  // Math Functions
  const handleBtn = (val: string) => setExpression(prev => prev + val);
  const calculate = () => {
    try {
      if (!expression) return;
      const res = math.evaluate(expression);
      setResult(res.toString());
    } catch (error) {
      setResult('خطأ في المعادلة');
    }
  };
  const clear = () => { setExpression(''); setResult(''); };
  const backspace = () => setExpression(prev => prev.slice(0, -1));
  const buttons = [
    '(', ')', '%', 'AC',
    'sin(', 'cos(', 'tan(', '/',
    '7', '8', '9', '*',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '0', '.', 'sqrt(', '='
  ];

  // Pricing Calculations
  const cost = Number(costPrice) || 0;
  const margin = Number(targetMargin) || 0;
  const tax = Number(taxRate) || 0;
  const sellingPriceBeforeTax = cost / (1 - (margin / 100));
  const profitAmount = sellingPriceBeforeTax - cost;
  const taxAmount = sellingPriceBeforeTax * (tax / 100);
  const finalSellingPrice = sellingPriceBeforeTax + taxAmount;

  // Currency Calculations
  const convertedAmount = (Number(amount) || 0) * (Number(exchangeRate) || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        <button onClick={() => setActiveTab('math')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'math' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><FunctionSquare size={18} /> الحاسبة المتقدمة</button>
        <button onClick={() => setActiveTab('pricing')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'pricing' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Percent size={18} /> حاسبة التسعير</button>
        <button onClick={() => setActiveTab('currency')} className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${activeTab === 'currency' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><ArrowRightLeft size={18} /> تحويل العملات</button>
      </div>

      {activeTab === 'math' && (
        <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="mb-4 text-center">
            <h3 className="text-xl font-bold text-gray-800">الحاسبة المتقدمة</h3>
            <p className="text-sm text-gray-500">تدعم المعادلات الرياضية المعقدة</p>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-xl mb-4 text-left" dir="ltr">
            <div className="text-gray-500 text-sm h-6 overflow-hidden">{expression}</div>
            <div className="text-3xl font-bold text-indigo-700 h-10 overflow-hidden">{result || '0'}</div>
          </div>

          <div className="grid grid-cols-4 gap-2" dir="ltr">
            {buttons.map((btn, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (btn === 'AC') clear();
                  else if (btn === '=') calculate();
                  else handleBtn(btn);
                }}
                className={`p-3 text-lg font-semibold rounded-lg transition-colors ${
                  btn === 'AC' ? 'bg-red-100 text-red-600 hover:bg-red-200' :
                  btn === '=' ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
                  ['/', '*', '-', '+'].includes(btn) ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' :
                  ['sin(', 'cos(', 'tan(', 'sqrt(', '(', ')', '%'].includes(btn) ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm' :
                  'bg-gray-50 text-gray-800 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {btn.replace('(', '')}
              </button>
            ))}
            <button 
              onClick={backspace}
              className="col-span-4 mt-2 p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
            >
              مسح (Backspace)
            </button>
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><CalcIcon size={20} className="text-indigo-600"/> مدخلات التسعير</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التكلفة الإجمالية للمنتج</label>
              <div className="relative">
                <input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="w-full p-2 pl-8 border rounded focus:ring-indigo-500 focus:border-indigo-500" placeholder="0.00" />
                <DollarSign size={16} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">هامش الربح المستهدف (%)</label>
              <div className="relative">
                <input type="number" value={targetMargin} onChange={(e) => setTargetMargin(e.target.value)} className="w-full p-2 pl-8 border rounded focus:ring-indigo-500 focus:border-indigo-500" placeholder="20" />
                <Percent size={16} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نسبة الضريبة (VAT %)</label>
              <div className="relative">
                <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="w-full p-2 pl-8 border rounded focus:ring-indigo-500 focus:border-indigo-500" placeholder="15" />
                <Percent size={16} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-xl shadow-sm border border-indigo-100 space-y-6">
            <h3 className="text-lg font-bold text-indigo-900 mb-4">نتائج التسعير</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-indigo-200">
                <span className="text-indigo-800">سعر البيع (قبل الضريبة):</span>
                <span className="font-bold text-lg" dir="ltr">{sellingPriceBeforeTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-indigo-200">
                <span className="text-green-700">قيمة الربح:</span>
                <span className="font-bold text-green-700" dir="ltr">+{profitAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-indigo-200">
                <span className="text-red-700">قيمة الضريبة ({taxRate}%):</span>
                <span className="font-bold text-red-700" dir="ltr">+{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="text-xl font-black text-indigo-900">سعر البيع النهائي (شامل الضريبة):</span>
                <span className="text-2xl font-black text-indigo-600 bg-white px-4 py-1 rounded-lg shadow-sm" dir="ltr">{finalSellingPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'currency' && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><ArrowRightLeft size={20} className="text-indigo-600"/> محول العملات</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-lg" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سعر الصرف</label>
              <input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-lg" placeholder="1.00" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">من عملة</label>
              <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-bold">
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="EUR">يورو (EUR)</option>
                <option value="AED">درهم إماراتي (AED)</option>
                <option value="EGP">جنيه مصري (EGP)</option>
              </select>
            </div>
            <div className="pt-6">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                <ArrowRightLeft size={20} />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">إلى عملة</label>
              <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-bold">
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="EUR">يورو (EUR)</option>
                <option value="AED">درهم إماراتي (AED)</option>
                <option value="EGP">جنيه مصري (EGP)</option>
              </select>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
            <p className="text-sm text-gray-500 mb-2">النتيجة</p>
            <div className="text-4xl font-black text-indigo-600 flex items-center justify-center gap-2" dir="ltr">
              <span>{convertedAmount.toFixed(2)}</span>
              <span className="text-2xl text-gray-400">{toCurrency}</span>
            </div>
            <p className="text-xs text-gray-400 mt-4">ملاحظة: يرجى تحديث سعر الصرف يدوياً للحصول على نتائج دقيقة.</p>
          </div>
        </div>
      )}
    </div>
  );
}
