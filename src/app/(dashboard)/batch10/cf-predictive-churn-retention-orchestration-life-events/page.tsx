"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "Predictive churn + retention orchestration (life-events + sentiment + outreach)";
const API_PATH = "/api/cf-predictive-churn-retention-orchestration-life-events";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
