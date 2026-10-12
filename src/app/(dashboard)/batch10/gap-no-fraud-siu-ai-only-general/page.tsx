"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No fraud / SIU AI (only general claims AI)";
const API_PATH = "/api/gap-no-fraud-siu-ai-only-general";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
