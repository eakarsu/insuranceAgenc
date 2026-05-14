/**
 * Inspect / paginate AI run results across all features.
 * Useful for cost telemetry and audit replay.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") || "20")));
  const feature = sp.get("feature") || undefined;
  const userId = sp.get("userId") || undefined;

  const where: any = {};
  if (feature) where.feature = feature;
  if (userId) where.userId = userId;

  const [data, total] = await Promise.all([
    prisma.aiResult.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.aiResult.count({ where }),
  ]);

  return NextResponse.json({
    data,
    pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
  });
}
