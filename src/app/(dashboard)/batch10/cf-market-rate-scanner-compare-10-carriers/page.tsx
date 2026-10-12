"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "Market-rate scanner (compare 10+ carriers continuously)";
const API_PATH = "/api/cf-market-rate-scanner-compare-10-carriers";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
