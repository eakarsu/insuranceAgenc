"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No accounting / GL integration (QuickBooks)";
const API_PATH = "/api/gap-no-accounting-gl-integration-quickbooks";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
