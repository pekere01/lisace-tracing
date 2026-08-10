import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyDetail } from "@/lib/companies";
import { buildCompanyWorkbook } from "@/lib/excel";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/export/company/[id]">
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await ctx.params;
  const companyId = Number(id);
  if (!Number.isFinite(companyId)) {
    return NextResponse.json({ error: "Geçersiz id" }, { status: 400 });
  }

  const company = await getCompanyDetail(companyId);
  if (!company) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const buffer = await buildCompanyWorkbook(company);
  const fileName = `${company.name.replace(/[\\/:*?"<>|]/g, "")}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  });
}
