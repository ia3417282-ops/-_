Import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * 1. دالة تصدير البيانات إلى Excel (تدعم العربية 100%)
 */
export const exportToExcel = (data: any[], fileName: string) => {
  if (!data || data.length === 0) {
    alert("لا توجد بيانات لتصديرها!");
    return;
  }

  // إنشاء ورقة العمل
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "البيانات");

  // توليد البيانات كـ ArrayBuffer لضمان توافق المتصفحات والموبايل
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // استخدام Blob مع ترميز UTF-8 لمنع الرموز الغريبة
  const finalData = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' 
  });

  saveAs(finalData, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * 2. دالة تصدير البيانات بصيغة نصية (عربية سليمة بفضل الـ BOM)
 */
export const exportToText = (data: any, fileName: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  
  // إضافة \ufeff (Byte Order Mark) لإجبار الموبايل على قراءة الملف كـ UTF-8 (عربي)
  const blob = new Blob(["\ufeff" + jsonString], { 
    type: 'text/plain;charset=utf-8' 
  });
  
  saveAs(blob, `${fileName}.txt`);
};

/**
 * 3. دالة الطباعة (تفتح نافذة الطباعة وتدعم العربية تلقائياً)
 */
export const printReport = () => {
  // نقوم بطلب الطباعة مباشرة من المتصفح
  // المتصفح سيقوم بتحويل الصفحة الحالية إلى PDF أو إرسالها للطابعة
  window.print();
};