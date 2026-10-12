"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No reinsurance / treaty analytics AI";
const API_PATH = "/api/gap-no-reinsurance-treaty-analytics-ai";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
