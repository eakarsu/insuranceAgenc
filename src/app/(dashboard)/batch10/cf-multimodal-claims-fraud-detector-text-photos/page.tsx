"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "Multimodal claims fraud detector (text + photos + patterns)";
const API_PATH = "/api/cf-multimodal-claims-fraud-detector-text-photos";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
