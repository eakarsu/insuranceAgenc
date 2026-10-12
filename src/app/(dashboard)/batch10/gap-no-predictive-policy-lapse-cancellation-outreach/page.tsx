"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No predictive policy lapse / cancellation outreach";
const API_PATH = "/api/gap-no-predictive-policy-lapse-cancellation-outreach";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
