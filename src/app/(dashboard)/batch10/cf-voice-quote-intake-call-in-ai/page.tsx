"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "Voice quote intake (call in, AI quotes in real time)";
const API_PATH = "/api/cf-voice-quote-intake-call-in-ai";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
