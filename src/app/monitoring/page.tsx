import { MonitoringDashboard } from "@/components/monitoring/MonitoringDashboard";

export const metadata = {
  title: "Stream Monitoring | TradeTV",
  description: "Real-time trade detection from live trading streams",
};

export default function MonitoringPage() {
  return <MonitoringDashboard />;
}
