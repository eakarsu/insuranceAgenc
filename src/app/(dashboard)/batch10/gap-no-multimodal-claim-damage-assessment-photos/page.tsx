"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No multimodal claim damage assessment (photos / videos)";
const API_PATH = "/api/gap-no-multimodal-claim-damage-assessment-photos";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
