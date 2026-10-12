import { Prisma, type AiResult } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import prisma from "./prisma";
import { createFeatureReportHandlers, type FeatureReport, type ProviderReport, type ReportActor, type ReportStore } from "./feature-reports";

function scope(actor: ReportActor, feature: string): Prisma.AiResultWhereInput { return { userId: actor.id, feature }; }
function promptOf(row: AiResult) { return row.input && typeof row.input === "object" && !Array.isArray(row.input) && typeof row.input.prompt === "string" ? row.input.prompt : ""; }
function report(row: AiResult): FeatureReport { return { id: row.id, prompt: promptOf(row), content: row.rawText || "", model: row.model, createdAt: row.createdAt, receipt: row.output }; }
function data(actor: ReportActor, feature: string, prompt: string, result: ProviderReport) {
  return { userId: actor.id, feature, model: result.model, input: { prompt } as Prisma.InputJsonValue, output: JSON.parse(JSON.stringify({ content: result.content, receipt: result.receipt })) as Prisma.InputJsonValue, rawText: result.content, error: null };
}
function versionedScope(actor: ReportActor, feature: string, previous: FeatureReport): Prisma.AiResultWhereInput {
  return { ...scope(actor, feature), id: previous.id, rawText: previous.content, model: previous.model, input: { path: ["prompt"], equals: previous.prompt } };
}
const store: ReportStore = {
  async list(actor, feature) { return (await prisma.aiResult.findMany({ where: scope(actor, feature), orderBy: { createdAt: "desc" }, take: 50 })).map(report); },
  async find(actor, feature, id) { const row = await prisma.aiResult.findFirst({ where: { ...scope(actor, feature), id } }); return row ? report(row) : null; },
  async create(actor, feature, prompt, result) { return report(await prisma.aiResult.create({ data: data(actor, feature, prompt, result) })); },
  async update(actor, feature, previous, prompt, result) {
    return prisma.$transaction(async tx => {
      const changed = await tx.aiResult.updateMany({ where: versionedScope(actor, feature, previous), data: data(actor, feature, prompt, result) });
      if (changed.count !== 1) return null;
      const row = await tx.aiResult.findFirst({ where: { ...scope(actor, feature), id: previous.id } });
      return row ? report(row) : null;
    });
  },
  async delete(actor, feature, previous) { return (await prisma.aiResult.deleteMany({ where: versionedScope(actor, feature, previous) })).count === 1; },
};
export function batchFeatureHandlers(feature: string, title: string) {
  return createFeatureReportHandlers({ feature: `batch10-advisory:${feature}`, title, store, authenticate: async () => {
    const session = await getServerSession(authOptions);
    const id = session?.user?.id;
    if (!id) return null;
    const user = await prisma.user.findFirst({ where: { id, isActive: true }, select: { id: true } });
    return user ? { id: user.id } : null;
  } });
}
