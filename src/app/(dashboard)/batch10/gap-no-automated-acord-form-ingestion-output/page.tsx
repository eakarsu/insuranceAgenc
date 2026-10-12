"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No automated ACORD form ingestion / output";
const API_PATH = "/api/gap-no-automated-acord-form-ingestion-output";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
