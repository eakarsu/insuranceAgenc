"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No real-time competitor rate intelligence";
const API_PATH = "/api/gap-no-real-time-competitor-rate-intelligence";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
