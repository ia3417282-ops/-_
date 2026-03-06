import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// 1. تصدير الإكسل (يعمل بشكل جيد عادةً)
export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(dataBlob, `${fileName}.xlsx`);
};

// 2. تصدير نصي (تم إصلاح الرموز الغريبة بإضافة الـ BOM)
export const exportToText = (data: any, fileName: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  // إضافة \ufeff هي المفتاح لحل مشكلة الرموز الغريبة
  const blob = new Blob(["\ufeff" + jsonString], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${fileName}.txt`);
};

// 3. تصدير Word (إضافة الـ BOM أيضاً)
export const exportToWord = (data: any, fileName: string) => {
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob(["\ufeff" + content], { type: 'application/msword;charset=utf-8' });
  saveAs(blob, `${fileName}.doc`);
};

// 4. تصدير PDF (يفضل استخدام مكتبة، لكن للحل السريع:)
export const exportToPDF = (data: any, fileName: string) => {
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob(["\ufeff" + content], { type: 'application/pdf;charset=utf-8' });
  saveAs(blob, `${fileName}.pdf`);
};
