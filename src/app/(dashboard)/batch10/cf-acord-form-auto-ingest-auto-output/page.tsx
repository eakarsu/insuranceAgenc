"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "ACORD form auto-ingest / auto-output";
const API_PATH = "/api/cf-acord-form-auto-ingest-auto-output";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
