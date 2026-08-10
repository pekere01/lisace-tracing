import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFullExportData } from "@/lib/companies";
import { buildFullReportWorkbook } from "@/lib/excel";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const rows = await getFullExportData();
  const buffer = await buildFullReportWorkbook(rows);
  const fileName = `lisanslar-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  });
}
