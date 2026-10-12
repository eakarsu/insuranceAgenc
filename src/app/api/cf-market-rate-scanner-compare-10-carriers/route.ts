import { batchFeatureHandlers } from "@/lib/batch-feature-reports";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const handlers = batchFeatureHandlers("cf-market-rate-scanner-compare-10-carriers", "Market-rate scanner (compare 10+ carriers continuously)");
export const GET = handlers.GET;
export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
