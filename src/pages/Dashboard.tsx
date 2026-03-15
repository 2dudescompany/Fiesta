import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../components/Dashboard/Sidebar";
import DashboardHome from "../components/Dashboard/DashboardHome";
import Analytics from "../components/Dashboard/Analytics";
import Integrations from "../components/Dashboard/Integrations";
import EmailAnalytics from "../components/Dashboard/EmailAnalytics";
import TtsAnalytics from "../components/Dashboard/TtsAnalytics";
import UATAnalytics from "../components/Dashboard/UATAnalytics";
import ChatbotConfig from "../components/Dashboard/ChatbotConfig";
import Business from "../components/Dashboard/Business";

import ChatbotWidget from "../components/Chatbot/ChatbotWidget";

import { useDictationCapture } from "../hooks/useDictationCapture";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { injectUAT } from "../lib/uatEmbed";

export default function Dashboard() {
  useDictationCapture();

  const { user, loading } = useAuth();
  const [chatbotKey, setChatbotKey] = useState(
    () => localStorage.getItem("havy_chatbot_key") || ""
  );
  const [businessName, setBusinessName] = useState(
    () => localStorage.getItem("havy_business_name") || ""
  );

  /* ---------- Shortcut UAT: inject tracker for dashboard owner ---------- */
  useEffect(() => {
    if (user) injectUAT();
  }, [user]);

  /* ---------- Load chatbot_key + business name from Supabase ---------- */
  useEffect(() => {
    if (!user) return;
    supabase
      .from("businesses")
      .select("chatbot_key, name")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.chatbot_key) {
          setChatbotKey(data.chatbot_key);
          localStorage.setItem("havy_chatbot_key", data.chatbot_key);
        }
        if (data?.name) {
          setBusinessName(data.name);
          localStorage.setItem("havy_business_name", data.name);
        }
      });
  }, [user]);

  /* ---------- Load saved widget config ---------- */
  const getChatbotConfig = () => {
    const saved = localStorage.getItem("chatbot_config");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  };

  const chatbotConfig = getChatbotConfig();

  /* ---------- Auth Guards ---------- */
  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8 overflow-x-hidden min-w-0">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="business" element={<Business />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="chatbot" element={<ChatbotConfig />} />
          <Route path="email" element={<EmailAnalytics />} />
          <Route path="tts" element={<TtsAnalytics />} />
          <Route path="uat" element={<UATAnalytics />} />

          <Route
            path="billing"
            element={
              <div className="card">
                <h1 className="text-xl font-semibold">
                  Billing & Subscription
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage your subscription and billing information.
                </p>
              </div>
            }
          />

          <Route
            path="settings"
            element={
              <div className="card">
                <h1 className="text-xl font-semibold">
                  Account Settings
                </h1>
                <p className="text-gray-600 mt-2">
                  Update your account preferences.
                </p>
              </div>
            }
          />
        </Routes>
      </main>

      {/* ---------- Chatbot Widget — renders as soon as user is known ---------- */}
      {user && (
        <ChatbotWidget
          chatbotKey={chatbotKey}
          businessName={businessName}
          position={chatbotConfig?.position || "bottom-right"}
          primaryColor={chatbotConfig?.primaryColor || "#6366f1"}
        />
      )}
    </div>
  );
}
