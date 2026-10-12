import { batchFeatureHandlers } from "@/lib/batch-feature-reports";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const handlers = batchFeatureHandlers("gap-no-automated-sr-22-form-generation", "No automated SR-22 / form generation per state");
export const GET = handlers.GET;
export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
