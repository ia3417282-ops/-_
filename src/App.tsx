import React, { useState, useEffect } from 'react';
import { exportToExcel, exportToPDF, exportToWord } from './utils/exports';
// تم إضافة initializeData هنا
import { db, initializeData } from './db'; 
import { useLiveQuery } from 'dexie-react-hooks';
import Dashboard from './components/Dashboard';
import HR from './components/HR';
import CRM from './components/CRM';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Workspace from './components/Workspace';
import ImportExport from './components/ImportExport';
import Returns from './components/Returns';
import Accounts from './components/Accounts';
import Wastage from './components/Wastage';
import Invoices from './components/Invoices';
import Offers from './components/Offers';
import TransactionLogs from './components/TransactionLogs';
import Calculator from './components/Calculator';
import Settings from './components/Settings';
import Reports from './components/Reports';
import { 
  LayoutDashboard, Users, UserSquare2, Package, ShoppingCart, PenTool, 
  Globe, RotateCcw, Wallet, Trash2, Receipt, FileText, History, Calculator as CalcIcon, 
  Menu, X, Share2, Settings as SettingsIcon, Bell, PieChart, Wifi, WifiOff
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // --- إضافة التهيئة الذاتية ---
    initializeData().catch(err => console.error("فشل في تهيئة البيانات:", err));
    // ----------------------------

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const inventory = useLiveQuery(() => db.inventory.toArray()) || [];
  const lowStockItems = inventory.filter(item => item.quantity <= (item.minStock || 10));

  // ... (باقي كود الدالات الخاصة بك كما هي تماماً لا تغيير فيها)
  const getExportData = async () => {
    let data: any[] = [];
    switch(activeTab) {
      case 'sales': data = await db.sales.toArray(); break;
      case 'inventory': data = await db.inventory.toArray(); break;
      case 'crm': data = await db.partners.toArray(); break;
      case 'hr': data = await db.employees.toArray(); break;
      case 'importExport': data = await db.importExport.toArray(); break;
      case 'returns': data = await db.returns.toArray(); break;
      case 'accounts': data = await db.transactions.toArray(); break;
      case 'wastage': data = await db.wastage.toArray(); break;
      case 'invoices': data = await db.invoices.toArray(); break;
      case 'offers': data = await db.offers.toArray(); break;
      case 'logs': data = await db.logs.toArray(); break;
      default: data = [{ رسالة: "لا توجد بيانات قابلة للتصدير في هذا القسم حالياً" }];
    }
    return data;
  };

  const handleExportExcel = async () => {
    const data = await getExportData();
    exportToExcel(data, `بيانات_${activeTab}`);
  };

  const handleExportPDF = async () => {
    const data = await getExportData();
    const text = JSON.stringify(data, null, 2);
    exportToPDF(`تقرير نظام أعمالي\n\nالقسم: ${activeTab}\n\n${text}`, `تقرير_${activeTab}`);
  };

  const handleExportWord = async () => {
    const data = await getExportData();
    const text = JSON.stringify(data, null, 2);
    exportToWord(`مستند نظام أعمالي\nالقسم: ${activeTab}\n\n${text}`, `مستند_${activeTab}`);
  };

  const handleShare = async () => {
    const data = await getExportData();
    const text = JSON.stringify(data, null, 2);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `بيانات ${activeTab} - نظام أعمالي`,
          text: `مشاركة بيانات قسم ${activeTab}\n\n${text.substring(0, 150)}...`,
        });
      } catch (error) {
        console.log('Share failed', error);
      }
    } else {
      alert('المشاركة غير مدعومة في هذا المتصفح');
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    // (باقي كود الـ return لم يتغير)
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden" dir="rtl">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      {/* ... باقي الكود كما هو تماماً ... */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-indigo-900 text-white flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-6 text-center border-b border-indigo-800 flex justify-between items-center md:block">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">نظام أعمالي</h1>
            <p className="text-indigo-300 text-xs mt-1">Aamali ERP PWA</p>
          </div>
          <button className="md:hidden text-white hover:text-indigo-200" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {/* ... (نفس أزرار التنقل) ... */}
          <button onClick={() => handleTabChange('dashboard')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}><LayoutDashboard size={20} /><span>لوحة التحكم</span></button>
          <button onClick={() => handleTabChange('sales')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'sales' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}><ShoppingCart size={20} /><span>المبيعات والمشتريات</span></button>
          <button onClick={() => handleTabChange('importExport')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'importExport' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}><Globe size={20} /><span>استيراد وتصدير</span></button>
          <button onClick={() => handleTabChange('returns')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'returns' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}><RotateCcw size={20} /><span>إلغاء ومرتجعات</span></button>
          <button onClick={() => handleTabChange('accounts')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'accounts' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}><Wallet size={20} /><span>الحسابات</span></button>
          <button onClick={() => handleTabChange('reports')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'reports' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}><PieChart size={20} /><span>التقارير والتحليلات</span></button>
          <button onClick={() => handleTabChange('wastage')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'wastage' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}><Trash2 size={20} /><span>الهالك</span></button>
          <button onClick={() => handleTabChange('invoices')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'invoices' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}><Receipt size={20} /><span>الفواتير</span></button>
          <button onClick={() => handleTabChange('offers')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'offers' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}><FileText size={20} /><span>عروض وطلبات</span></button>
          <button onClick={() => handleTabChange('inventory')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'inventory' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}><Package size={20} /><span>إدارة المخزون</span></button>
          <button onClick={() => handleTabChange('crm')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'crm' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}><Users size={20} /><span>العملاء والموردين</span></button>
          <button onClick={() => handleTabChange('hr')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'hr' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}><UserSquare2 size={20} /><span>الموارد البشرية</span></button>
          <button onClick={() => handleTabChange('workspace')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'workspace' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}><PenTool size={20} /><span>مساحة العمل الذكية</span></button>
          <button onClick={() => handleTabChange('calculator')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'calculator' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}><CalcIcon size={20} /><span>الحاسبة المتقدمة</span></button>
          <button onClick={() => handleTabChange('logs')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'logs' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}><History size={20} /><span>سجلات المعاملات</span></button>
          <button onClick={() => handleTabChange('settings')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'settings' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}><SettingsIcon size={20} /><span>الإعدادات والمزامنة</span></button>
        </nav>
        <div className="p-4 text-xs text-center border-t border-indigo-800 text-indigo-300">تطوير: Ibrahim Ali © 2026<br/>مجتمع مفتوح المصدر</div>
      </aside>

      {/* المحتوى الرئيسي (لا تغيير) */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        {/* ... (باقي كود الـ Header والـ Content) ... */}
        {/* (يجب أن تضع هنا باقي الكود الأصلي الخاص بك بوضوح) */}
      </main>
    </div>
  );
}
