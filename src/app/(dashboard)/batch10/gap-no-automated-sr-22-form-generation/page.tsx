"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No automated SR-22 / form generation per state";
const API_PATH = "/api/gap-no-automated-sr-22-form-generation";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
