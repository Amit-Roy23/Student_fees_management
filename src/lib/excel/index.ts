import * as XLSX from "xlsx";

/**
 * Downloads a generated workbook in the browser.
 */
export function downloadWorkbook(workbook: XLSX.WorkBook, fileName: string) {
  XLSX.writeFile(workbook, fileName);
}

/**
 * Exports data rows to an Excel (.xlsx) file.
 */
export function exportToExcel(
  data: Record<string, any>[],
  fileName: string,
  sheetName: string = "Sheet1"
) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  downloadWorkbook(workbook, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
}

/**
 * Generates and downloads the standard student admission template.
 */
export function downloadStudentImportTemplate() {
  const templateData = [
    {
      admissionNo: "AVM-2026-101",
      name: "Siddhartha Bose",
      class: "Class 1",
      guardianName: "Debabrata Bose",
      guardianPhone: "9830198765",
      address: "12/A Southern Avenue, Kolkata",
      admissionDate: "2026-04-01",
      admissionFee: 6000,
      totalRemainingFee: 36000,
      installments: 10,
    },
    {
      admissionNo: "AVM-2026-102",
      name: "Sunita Roy",
      class: "Class 2",
      guardianName: "Alok Roy",
      guardianPhone: "9830212345",
      address: "45 Lake Road, Kolkata",
      admissionDate: "2026-04-02",
      admissionFee: 6000,
      totalRemainingFee: 36000,
      installments: 10,
    },
  ];

  exportToExcel(templateData, "SchoolPay_Student_Admission_Template.xlsx", "AdmissionTemplate");
}
