import React, { useState, useEffect } from 'react';
import { exportToExcel, exportToPDF, exportToWord } from './utils/exports';
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
    // --- دالة التهيئة الذاتية لقاعدة البيانات ---
    initializeData().catch(err => console.error("Initialization failed:", err));

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
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden" dir="rtl">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* الشريط الجانبي */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-indigo-900 text-white flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-6 text-center border-b border-indigo-800 flex justify-between items-center md:block">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">نظام أعمالي</h1>
            <p className="text-indigo-300 text-xs mt-1">Aamali ERP PWA</p>
          </div>
          <button className="md:hidden text-white hover:text-indigo-200" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <button onClick={() => handleTabChange('dashboard')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}>
            <LayoutDashboard size={20} /><span>لوحة التحكم</span>
          </button>
          <button onClick={() => handleTabChange('sales')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'sales' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}>
            <ShoppingCart size={20} /><span>المبيعات والمشتريات</span>
          </button>
          <button onClick={() => handleTabChange('importExport')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'importExport' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}>
            <Globe size={20} /><span>استيراد وتصدير</span>
          </button>
          <button onClick={() => handleTabChange('returns')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'returns' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}>
            <RotateCcw size={20} /><span>إلغاء ومرتجعات</span>
          </button>
          <button onClick={() => handleTabChange('accounts')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'accounts' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}>
            <Wallet size={20} /><span>الحسابات</span>
          </button>
          <button onClick={() => handleTabChange('reports')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'reports' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}>
            <PieChart size={20} /><span>التقارير والتحليلات</span>
          </button>
          <button onClick={() => handleTabChange('wastage')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'wastage' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}>
            <Trash2 size={20} /><span>الهالك</span>
          </button>
          <button onClick={() => handleTabChange('invoices')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'invoices' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}>
            <Receipt size={20} /><span>الفواتير</span>
          </button>
          <button onClick={() => handleTabChange('offers')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'offers' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}>
            <FileText size={20} /><span>عروض وطلبات</span>
          </button>
          <button onClick={() => handleTabChange('inventory')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'inventory' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}>
            <Package size={20} /><span>إدارة المخزون</span>
          </button>
          <button onClick={() => handleTabChange('crm')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'crm' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}>
            <Users size={20} /><span>العملاء والموردين</span>
          </button>
          <button onClick={() => handleTabChange('hr')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'hr' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}>
            <UserSquare2 size={20} /><span>الموارد البشرية</span>
          </button>
          <button onClick={() => handleTabChange('workspace')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'workspace' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}>
            <PenTool size={20} /><span>مساحة العمل الذكية</span>
          </button>
          <button onClick={() => handleTabChange('calculator')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'calculator' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}>
            <CalcIcon size={20} /><span>الحاسبة المتقدمة</span>
          </button>
          <button onClick={() => handleTabChange('logs')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'logs' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}>
            <History size={20} /><span>سجلات المعاملات</span>
          </button>
          <button onClick={() => handleTabChange('settings')} className={`w-full flex items-center gap-3 text-right p-3 rounded transition-colors ${activeTab === 'settings' ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-800'}`}>
            <SettingsIcon size={20} /><span>الإعدادات والمزامنة</span>
          </button>
        </nav>
        <div className="p-4 text-xs text-center border-t border-indigo-800 text-indigo-300">
          تطوير: Ibrahim Ali © 2026<br/>مجتمع مفتوح المصدر
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-gray-600 hover:text-indigo-600" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={28} />
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 hidden sm:block">
              {activeTab === 'dashboard' && 'نظرة عامة'}
              {activeTab === 'sales' && 'المبيعات والمشتريات'}
              {activeTab === 'importExport' && 'استيراد وتصدير'}
              {activeTab === 'returns' && 'إلغاء ومرتجعات'}
              {activeTab === 'accounts' && 'الحسابات'}
              {activeTab === 'reports' && 'التقارير والتحليلات'}
              {activeTab === 'wastage' && 'الهالك'}
              {activeTab === 'invoices' && 'الفواتير'}
              {activeTab === 'offers' && 'عروض وطلبات'}
              {activeTab === 'inventory' && 'إدارة المخزون'}
              {activeTab === 'crm' && 'إدارة علاقات العملاء'}
              {activeTab === 'hr' && 'إدارة الموارد البشرية'}
              {activeTab === 'workspace' && 'مساحة العمل (محرر المهام)'}
              {activeTab === 'calculator' && 'الحاسبة المتقدمة'}
              {activeTab === 'logs' && 'سجلات المعاملات'}
              {activeTab === 'settings' && 'الإعدادات والمزامنة'}
            </h2>
            
            {/* حالة الشبكة للكمبيوتر */}
            <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isOnline ? 'متصل بالإنترنت' : 'شبكة محلية (Offline)'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 relative">
            {/* حالة الشبكة للموبايل */}
            <div className={`md:hidden flex items-center justify-center w-8 h-8 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`} title={isOnline ? 'متصل بالإنترنت' : 'شبكة محلية (Offline)'}>
              {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            </div>

            {/* الإشعارات */}
            <button 
              className="text-gray-500 hover:text-indigo-600 p-2 relative" 
              title="التنبيهات"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} />
              {lowStockItems.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                  {lowStockItems.length}
                </span>
              )}
            </button>
            
            {/* قائمة الإشعارات */}
            {showNotifications && (
              <div className="absolute top-full mt-2 left-0 md:right-0 md:left-auto w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-sm">التنبيهات</div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {lowStockItems.length > 0 ? (
                    lowStockItems.map(item => (
                      <div key={item.id} className="p-2 border-b border-gray-100 last:border-0 text-sm">
                        <span className="text-red-600 font-bold">تنبيه مخزون: </span>
                        الصنف "{item.name}" وصل للحد الأدنى ({item.quantity} {item.unit}).
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">لا توجد تنبيهات حالياً</div>
                  )}
                </div>
              </div>
            )}

            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            
            {/* أزرار التصدير والمشاركة */}
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 md:px-4 rounded text-xs md:text-sm font-medium transition-colors flex items-center gap-1" onClick={handleShare}>
              <Share2 size={16} /> <span className="hidden md:inline">مشاركة</span>
            </button>
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 md:px-4 rounded text-xs md:text-sm font-medium transition-colors" onClick={handleExportExcel}>
              Excel
            </button>
            <button className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 md:px-4 rounded text-xs md:text-sm font-medium transition-colors" onClick={handleExportPDF}>
              PDF
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 md:px-4 rounded text-xs md:text-sm font-medium transition-colors" onClick={handleExportWord}>
              Word
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 min-h-[calc(100vh-10rem)]">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'sales' && <Sales />}
            {activeTab === 'importExport' && <ImportExport />}
            {activeTab === 'returns' && <Returns />}
            {activeTab === 'accounts' && <Accounts />}
            {activeTab === 'reports' && <Reports />}
            {activeTab === 'wastage' && <Wastage />}
            {activeTab === 'invoices' && <Invoices />}
            {activeTab === 'offers' && <Offers />}
            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'crm' && <CRM />}
            {activeTab === 'hr' && <HR />}
            {activeTab === 'workspace' && <Workspace />}
            {activeTab === 'calculator' && <Calculator />}
            {activeTab === 'logs' && <TransactionLogs />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </div>
      </main>
    </div>
  );
}
