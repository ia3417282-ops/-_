import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * 1. Export to Excel
 */
export const exportToExcel = (data: any[], fileName: string) => {
  if (!data || data.length === 0) {
    alert("No data to export!");
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const finalData = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' 
  });
  saveAs(finalData, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * 2. Export to Text (UTF-8 with BOM)
 */
export const exportToText = (data: any, fileName: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob(["\ufeff" + jsonString], { 
    type: 'text/plain;charset=utf-8' 
  });
  saveAs(blob, `${fileName}.txt`);
};

/**
 * 3. Print
 */
export const printReport = () => {
  window.print();
};
