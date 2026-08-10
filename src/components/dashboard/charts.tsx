"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function SolidworksTierChart({
  data,
}: {
  data: { tier: string; count: number }[];
}) {
  const config: ChartConfig = { count: { label: "Adet" } };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SolidWorks Tip Dağılımı</CardTitle>
          <CardDescription>Henüz SolidWorks lisansı yok.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SolidWorks Tip Dağılımı</CardTitle>
        <CardDescription>Lisans tipine göre dağılım</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="tier" />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="tier"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((entry, i) => (
                <Cell key={entry.tier} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function SolidcamModuleChart({
  data,
}: {
  data: { module: string; count: number }[];
}) {
  const config: ChartConfig = { count: { label: "Adet", color: "var(--chart-1)" } };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SolidCAM En Çok Kullanılan Modüller</CardTitle>
          <CardDescription>Henüz SolidCAM modül verisi yok.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SolidCAM En Çok Kullanılan Modüller</CardTitle>
        <CardDescription>Modül bazlı kullanım sayısı</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
          <BarChart data={data} margin={{ bottom: 48 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="module"
              tickLine={false}
              axisLine={false}
              angle={-35}
              textAnchor="end"
              height={70}
              interval={0}
              fontSize={11}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
