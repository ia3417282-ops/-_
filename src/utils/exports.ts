import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

// 1. تصدير Excel
export const exportToExcel = (data: any[], fileName: string) => {
  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "البيانات");
  writeFile(wb, `${fileName}.xlsx`);
};

// 2. تصدير PDF
export const exportToPDF = (text: string, fileName: string) => {
  const doc = new jsPDF();
  doc.setFont("helvetica"); // يُنصح بإضافة خط عربي مخصص هنا
  doc.text(text, 10, 10);
  doc.save(`${fileName}.pdf`);
};

// 3. تصدير Word
export const exportToWord = async (text: string, fileName: string) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun(text)],
        }),
      ],
    }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
};
