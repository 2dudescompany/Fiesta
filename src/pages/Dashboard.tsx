import React, { useEffect, useState } from "react";
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
import { injectUAT } from "../lib/uatEmbed";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  useDictationCapture();

  const { user, loading } = useAuth();

  const [chatbotKey, setChatbotKey] = useState<string>("");

  /* ---------- Load business chatbot key ---------- */
useEffect(() => {
  const getInitialSession = async () => {
    const { data } = await supabase.auth.getSession();
    const currentUser = data.session?.user ?? null;

    setUser(currentUser);
    setLoading(false); // 🔥 loading depends ONLY on auth
  };

  getInitialSession();

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false); // 🔥 never depend on business fetch
    }
  );

  return () => {
    listener.subscription.unsubscribe();
  };
}, []);


// 🔥 Separate business fetch completely
useEffect(() => {
  if (!user) {
    setBusiness(null);
    return;
  }

  const loadBusiness = async () => {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", user.id);

    if (data && data.length > 0) {
      setBusiness(data[0]);
    } else {
      setBusiness(null);
    }
  };

  loadBusiness();
}, [user]);

  /* ---------- Inject UAT ---------- */
  useEffect(() => {
    injectUAT();
  }, []);

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

      <main className="flex-1 p-8">
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

      {/* ---------- Chatbot Widget ---------- */}
      <ChatbotWidget
        userId={user.id}
        position={chatbotConfig?.position || "bottom-right"}
        primaryColor={chatbotConfig?.primaryColor || "#3B82F6"}
        chatbotKey={chatbotKey}
      />
    </div>
  );
}
