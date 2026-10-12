"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "Underwriting automation agent (approve/decline/rate + human review)";
const API_PATH = "/api/cf-underwriting-automation-agent-approve-decline-rate";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
