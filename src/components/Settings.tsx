import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Settings() {
  const settings = useLiveQuery(() => db.settings.toArray());
  const [taxRate, setTaxRate] = useState('15');
  const [logo, setLogo] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      const tax = settings.find(s => s.key === 'taxRate')?.value;
      const savedLogo = settings.find(s => s.key === 'logo')?.value;
      if (tax) setTaxRate(tax);
      if (savedLogo) setLogo(savedLogo);
    }
  }, [settings]);

  const saveSettings = async () => {
    await db.settings.put({ id: 1, key: 'taxRate', value: taxRate });
    await db.settings.put({ id: 2, key: 'logo', value: logo });
    alert('تم حفظ الإعدادات بنجاح');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const exportBackup = async () => {
    const tables = ['inventory', 'sales', 'employees', 'partners', 'returns', 'wastage', 'invoices', 'offers', 'transactions', 'importExport', 'attendance', 'payroll', 'notifications'];
    const backup: any = {};
    for (const table of tables) {
      backup[table] = await (db as any)[table].toArray();
    }
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aamali_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        const tables = ['inventory', 'sales', 'employees', 'partners', 'returns', 'wastage', 'invoices', 'offers', 'transactions', 'importExport', 'attendance', 'payroll', 'notifications'];
        
        if (window.confirm('تحذير: استعادة النسخة الاحتياطية ستقوم بمسح جميع البيانات الحالية واستبدالها. هل أنت متأكد؟')) {
          for (const table of tables) {
            if (backup[table]) {
              await (db as any)[table].clear();
              await (db as any)[table].bulkAdd(backup[table]);
            }
          }
          alert('تمت استعادة النسخة الاحتياطية بنجاح! يرجى تحديث الصفحة.');
          window.location.reload();
        }
      } catch (error) {
        console.error('Error parsing backup file:', error);
        alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية. تأكد من أنه ملف JSON صالح.');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-indigo-900">تخصيص الهوية التجارية (White-labeling)</h3>
        <p className="text-sm text-gray-500 mb-6">قم بتخصيص النظام ليناسب هويتك التجارية، سيظهر الشعار في الفواتير والتقارير.</p>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">شعار الشركة (Logo)</label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full p-2 border rounded border-gray-300" />
            {logo && <img src={logo} alt="Logo" className="mt-4 h-24 object-contain border p-2 rounded bg-gray-50" />}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نسبة ضريبة القيمة المضافة (%)</label>
            <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="w-full p-2 border rounded border-gray-300" />
          </div>
          <button onClick={saveSettings} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition-colors font-bold">حفظ الإعدادات</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-indigo-900">المزامنة والنسخ الاحتياطي (Cloud Sync & Backup)</h3>
        <p className="text-sm text-gray-500 mb-6">بما أن التطبيق "محلي أولاً"، فإنه معرض للفقدان إذا تم مسح بيانات المتصفح. قم بحفظ نسخة احتياطية بشكل دوري.</p>
        <div className="flex flex-wrap gap-4">
          <button onClick={exportBackup} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors font-bold shadow-sm">
            تنزيل نسخة احتياطية (JSON)
          </button>
          
          <div className="relative">
            <input 
              type="file" 
              accept=".json" 
              onChange={importBackup} 
              ref={fileInputRef}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              title="استعادة نسخة احتياطية"
            />
            <button className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700 transition-colors font-bold shadow-sm pointer-events-none">
              استعادة نسخة احتياطية (JSON)
            </button>
          </div>

          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors opacity-50 cursor-not-allowed font-bold" title="قريباً">
            ربط مع Google Drive (قريباً)
          </button>
        </div>
      </div>
    </div>
  );
}
