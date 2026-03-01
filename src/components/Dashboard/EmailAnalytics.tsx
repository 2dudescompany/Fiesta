import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import DownloadReportButton from "../common/DownloadReportButton";


const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"];

type Stat = {
  name: string;
  value: number;
};

type TimeCount = {
  label: string;
  count: number;
};

type EmailRow = {
  received_at: string;
  intent_category: string | null;
  status: string | null;
};

export default function EmailAnalytics() {
  const [emailsPerDay, setEmailsPerDay] = useState<TimeCount[]>([]);
  const [intentData, setIntentData] = useState<Stat[]>([]);
  const [statusData, setStatusData] = useState<Stat[]>([]);
  const [hourlyData, setHourlyData] = useState<TimeCount[]>([]);
  const [totalEmails, setTotalEmails] = useState(0);
  const [todayEmails, setTodayEmails] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);

    const { data, error } = await supabase
      .from("email_logs")
      .select("received_at, intent_category, status")
      .order("received_at", { ascending: true });

    if (error || !data) {
      setLoading(false);
      return;
    }

    const rows = data as EmailRow[];

    /* ---------- Summary ---------- */
    setTotalEmails(rows.length);

    const today = new Date().toISOString().slice(0, 10);
    const todayCount = rows.filter(
      (e) => e.received_at?.slice(0, 10) === today
    ).length;
    setTodayEmails(todayCount);

    const successCount = rows.filter(
      (e) => e.status === "success"
    ).length;

    setSuccessRate(
      rows.length ? Math.round((successCount / rows.length) * 100) : 0
    );

    /* ---------- Emails per day ---------- */
    const dayMap: Record<string, number> = {};

    rows.forEach((e) => {
      if (!e.received_at) return;
      const day = e.received_at.slice(0, 10);
      dayMap[day] = (dayMap[day] || 0) + 1;
    });

    setEmailsPerDay(
      Object.entries(dayMap).map(([label, count]) => ({
        label,
        count,
      }))
    );

    /* ---------- Intent distribution ---------- */
    const intentMap: Record<string, number> = {};

    rows.forEach((e) => {
      const key = e.intent_category || "Unknown";
      intentMap[key] = (intentMap[key] || 0) + 1;
    });

    setIntentData(
      Object.entries(intentMap).map(([name, value]) => ({
        name,
        value,
      }))
    );

    /* ---------- Status distribution ---------- */
    const statusMap: Record<string, number> = {};

    rows.forEach((e) => {
      const key = e.status || "unknown";
      statusMap[key] = (statusMap[key] || 0) + 1;
    });

    setStatusData(
      Object.entries(statusMap).map(([name, value]) => ({
        name,
        value,
      }))
    );

    /* ---------- Hourly distribution ---------- */
    const hourMap: Record<string, number> = {};

    rows.forEach((e) => {
      if (!e.received_at) return;
      const hour = new Date(e.received_at)
        .getHours()
        .toString()
        .padStart(2, "0");
      hourMap[hour] = (hourMap[hour] || 0) + 1;
    });

    setHourlyData(
      Object.entries(hourMap).map(([label, count]) => ({
        label: `${label}:00`,
        count,
      }))
    );

    setLoading(false);
  }

if (loading)
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">

        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>

        {/* Loading text */}
        <p className="text-gray-600 font-medium animate-pulse">
          Loading analytics...
        </p>

      </div>
    </div>
  );

  return (
    <div className="space-y-8" id="analyticsExport">

      {/* ---------- Summary Cards ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3>Total Emails</h3>
          <p className="text-3xl font-bold">{totalEmails}</p>
        </div>

        <div className="card">
          <h3>Emails Today</h3>
          <p className="text-3xl font-bold">{todayEmails}</p>
        </div>

        <div className="card">
          <h3>Success Rate</h3>
          <p className="text-3xl font-bold">{successRate}%</p>
        </div>
      </div>

      {/* ---------- Emails per day ---------- */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Emails per day</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={emailsPerDay}>
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>

 {/* ---------- Pie Charts Row ---------- */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

  {/* ---------- Intent distribution ---------- */}
  <div className="card">
    <h2 className="text-lg font-semibold mb-4">
      Intent Distribution
    </h2>
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={intentData}
          dataKey="value"
          nameKey="name"
          outerRadius={110}
          label
        >
          {intentData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>

  {/* ---------- Status distribution ---------- */}
  <div className="card">
    <h2 className="text-lg font-semibold mb-4">
      Response Status Distribution
    </h2>
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={statusData}
          dataKey="value"
          nameKey="name"
          outerRadius={110}
          label
        >
          {statusData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>

</div>

      {/* ---------- Hourly distribution ---------- */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">
          Emails by hour
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyData}>
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#16a34a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DownloadReportButton targetId="analyticsExport" fileName="analytics-report.pdf"/>
    </div>
  );
}
