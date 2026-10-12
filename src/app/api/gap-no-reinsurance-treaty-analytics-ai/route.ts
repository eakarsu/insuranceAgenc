import { batchFeatureHandlers } from "@/lib/batch-feature-reports";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const handlers = batchFeatureHandlers("gap-no-reinsurance-treaty-analytics-ai", "No reinsurance / treaty analytics AI");
export const GET = handlers.GET;
export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
