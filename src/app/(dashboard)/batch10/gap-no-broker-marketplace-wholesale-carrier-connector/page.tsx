"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No broker marketplace / wholesale carrier connector";
const API_PATH = "/api/gap-no-broker-marketplace-wholesale-carrier-connector";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
