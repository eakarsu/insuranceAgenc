"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No agency-management vendor sync (AMS360, Vertafore)";
const API_PATH = "/api/gap-no-agency-management-vendor-sync-ams360";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
