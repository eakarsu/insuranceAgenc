import { batchFeatureHandlers } from "@/lib/batch-feature-reports";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const handlers = batchFeatureHandlers("gap-no-e-signature-integration-documented", "No e-signature integration documented");
export const GET = handlers.GET;
export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
