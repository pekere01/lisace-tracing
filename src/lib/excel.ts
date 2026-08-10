import ExcelJS from "exceljs";
import { FAMILY_DISPLAY_NAME } from "@/lib/licenses";
import { STATUS_LABEL } from "@/lib/dates";
import type { CompanyDetail, LicenseExportRow } from "@/lib/companies";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F2937" },
};

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = HEADER_FILL;
}

export async function buildCompanyWorkbook(company: CompanyDetail): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Lisans Paneli";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet((company.name || "Firma").slice(0, 31));
  sheet.columns = [
    { header: "Alan", key: "field", width: 20 },
    { header: "Değer", key: "value", width: 50 },
  ];
  styleHeaderRow(sheet.getRow(1));
  sheet.addRows([
    { field: "Firma Adı", value: company.name },
    { field: "Adres", value: company.address ?? "" },
    { field: "Yetkili", value: company.contact?.fullName ?? "" },
    { field: "Telefon", value: company.contact?.phone ?? "" },
    { field: "Not", value: company.note?.note ?? "" },
  ]);

  sheet.addRow([]);
  const licenseHeaderRowIndex = sheet.rowCount + 1;
  const licenseHeaderRow = sheet.addRow([
    "Ürün",
    "Tip / Modül",
    "Seri No",
    "Bitiş Tarihi",
    "Kalan Gün",
    "Durum",
  ]);
  styleHeaderRow(sheet.getRow(licenseHeaderRowIndex));
  void licenseHeaderRow;

  for (const l of company.licenses) {
    sheet.addRow([
      FAMILY_DISPLAY_NAME[l.family] ?? l.family,
      l.label,
      l.serialNumber ?? "",
      l.subDate ?? l.trialDate ?? "",
      l.days ?? "",
      l.status ? STATUS_LABEL[l.status] : "",
    ]);
  }

  sheet.getColumn(2).width = 30;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function buildFullReportWorkbook(rows: LicenseExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Lisans Paneli";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Lisanslar");
  sheet.columns = [
    { header: "Firma", key: "companyName", width: 32 },
    { header: "Yetkili", key: "contactName", width: 20 },
    { header: "Telefon", key: "contactPhone", width: 16 },
    { header: "Ürün", key: "family", width: 16 },
    { header: "Tip / Modül", key: "label", width: 26 },
    { header: "Seri No", key: "serialNumber", width: 16 },
    { header: "Bitiş Tarihi", key: "date", width: 14 },
    { header: "Kalan Gün", key: "days", width: 12 },
    { header: "Durum", key: "status", width: 14 },
  ];
  styleHeaderRow(sheet.getRow(1));

  for (const r of rows) {
    sheet.addRow({
      companyName: r.companyName,
      contactName: r.contactName ?? "",
      contactPhone: r.contactPhone ?? "",
      family: FAMILY_DISPLAY_NAME[r.family] ?? r.family,
      label: r.label,
      serialNumber: r.serialNumber ?? "",
      date: r.subDate ?? r.trialDate ?? "",
      days: r.days ?? "",
      status: r.status ? STATUS_LABEL[r.status] : "",
    });
  }

  sheet.autoFilter = { from: "A1", to: "I1" };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
