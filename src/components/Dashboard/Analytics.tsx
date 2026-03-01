//import React from 'react';
//import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
//import { TrendingUp, TrendingDown, Users, Globe, Clock, Zap } from 'lucide-react';

/*const Analytics: React.FC = () => {
  const performanceData = [
    { date: '2025-01-01', chatbot: 1200, email: 800, tts: 400, users: 300 },
    { date: '2025-01-02', chatbot: 1350, email: 850, tts: 450, users: 320 },
    { date: '2025-01-03', chatbot: 1100, email: 750, tts: 380, users: 280 },
    { date: '2025-01-04', chatbot: 1600, email: 920, tts: 520, users: 350 },
    { date: '2025-01-05', chatbot: 1800, email: 1100, tts: 600, users: 400 },
    { date: '2025-01-06', chatbot: 1950, email: 1200, tts: 650, users: 420 },
    { date: '2025-01-07', chatbot: 2100, email: 1300, tts: 700, users: 450 }
  ];

  const languageData = [
    { name: 'English', value: 45, color: '#3B82F6' },
    { name: 'Spanish', value: 20, color: '#10B981' },
    { name: 'French', value: 15, color: '#F59E0B' },
    { name: 'German', value: 12, color: '#EF4444' },
    { name: 'Others', value: 8, color: '#8B5CF6' }
  ];

  const regionData = [
    { region: 'North America', interactions: 8500, growth: 12.5 },
    { region: 'Europe', interactions: 6200, growth: 8.3 },
    { region: 'Asia Pacific', interactions: 4100, growth: 15.7 },
    { region: 'Latin America', interactions: 2800, growth: 9.2 },
    { region: 'Others', interactions: 1400, growth: 6.1 }
  ];

  const metrics = [
    {
      title: 'Response Time',
      value: '0.8s',
      change: '-15%',
      changeType: 'positive' as const,
      icon: Clock,
      description: 'Average response time'
    },
    {
      title: 'Success Rate',
      value: '98.5%',
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: Zap,
      description: 'Successful interactions'
    },
    {
      title: 'User Satisfaction',
      value: '4.8/5',
      change: '+0.3',
      changeType: 'positive' as const,
      icon: Users,
      description: 'Average user rating'
    },
    {
      title: 'Global Reach',
      value: '47',
      change: '+3',
      changeType: 'positive' as const,
      icon: Globe,
      description: 'Countries served'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Detailed insights into your AI service performance</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Last 7 days
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      //{Performance Metrics }
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <div className="flex items-center mt-2">
                  {metric.changeType === 'positive' ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <metric.icon className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      //{Charts}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Service Usage Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
              <YAxis />
              <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString()} />
              <Line type="monotone" dataKey="chatbot" stroke="#3B82F6" strokeWidth={2} name="Chatbot" />
              <Line type="monotone" dataKey="email" stroke="#10B981" strokeWidth={2} name="Email" />
              <Line type="monotone" dataKey="tts" stroke="#F59E0B" strokeWidth={2} name="Text-to-Speech" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Language Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={languageData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {languageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      //{ Regional Performance }
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Regional Performance</h3>
        <div className="space-y-4">
          {regionData.map((region, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{region.region}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{region.interactions.toLocaleString()} interactions</span>
                    <span className={`text-sm ${region.growth > 10 ? 'text-green-600' : 'text-blue-600'}`}>
                      +{region.growth}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(region.interactions / 8500) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      //{Detailed Statistics }
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Detailed Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Chatbot Performance</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Conversations:</span>
                <span className="font-medium">12,489</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Resolved Queries:</span>
                <span className="font-medium">11,821 (94.6%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Session Duration:</span>
                <span className="font-medium">3m 24s</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Email Responder</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Emails Processed:</span>
                <span className="font-medium">8,467</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Response Rate:</span>
                <span className="font-medium">99.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Response Time:</span>
                <span className="font-medium">0.3s</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Text-to-Speech</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Audio Generated:</span>
                <span className="font-medium">3,892 files</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Duration:</span>
                <span className="font-medium">42h 18m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quality Score:</span>
                <span className="font-medium">4.9/5.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
 */

import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';

type EmailsPerDayRow = {
  day: string;
  email_count: number;
};

type IntentDistributionRow = {
  intent_category: string;
  count: number;
};

export default function Analytics() {
  const [emailsPerDay, setEmailsPerDay] = useState<EmailsPerDayRow[]>([]);
  const [intentData, setIntentData] = useState<IntentDistributionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      const { data: daily } = await supabase
        .from('analytics_emails_per_day')
        .select('*');

      const { data: intents } = await supabase
        .from('analytics_intent_distribution')
        .select('*');

      setEmailsPerDay(daily || []);
      setIntentData(intents || []);
      setLoading(false);
    }

    loadAnalytics();
  }, []);

  if (loading) return <p>Loading analytics...</p>;

  return (
    <div>
      {/* charts go here */}
    </div>
  );
}
