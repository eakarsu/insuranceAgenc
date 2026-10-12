import { batchFeatureHandlers } from "@/lib/batch-feature-reports";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const handlers = batchFeatureHandlers("cf-multimodal-claims-fraud-detector-text-photos", "Multimodal claims fraud detector (text + photos + patterns)");
export const GET = handlers.GET;
export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
