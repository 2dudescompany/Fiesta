import React, { useState } from 'react';
import { Copy, Check, Code, Globe, Palette, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Integrations: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { user } = useAuth();

  const getChatbotSnippet = () => {
    const saved = localStorage.getItem('chatbot_config');
    let cfg = { position: 'bottom-right', primaryColor: '#6366f1' };
    if (saved) {
      try { cfg = { ...cfg, ...JSON.parse(saved) }; } catch { /**/ }
    }
    const origin = window.location.origin;
    return `<!-- HAVY Chatbot + UAT Widget -->
<script>
(function(){
  window.HAVYChatbotConfig = {
    chatbotKey: 'YOUR_CHATBOT_KEY',
    businessName: 'Your Business Name',
    position: '${cfg.position}',
    primaryColor: '${cfg.primaryColor}',
    havyOrigin: '${origin}',
    supabaseUrl: '${import.meta.env.VITE_SUPABASE_URL}',
    anonKey: '${import.meta.env.VITE_SUPABASE_ANON_KEY}',
  };
  window.HAVY_CLIENT_ID = '${user?.id || 'YOUR_BUSINESS_ID'}';
  window.HAVY_SUPABASE_URL = '${import.meta.env.VITE_SUPABASE_URL}';
  window.HAVY_SUPABASE_ANON_KEY = '${import.meta.env.VITE_SUPABASE_ANON_KEY}';

  // Load chatbot widget
  var s = document.createElement('script');
  s.src = '${origin}/chatbot-widget.js'; s.defer = true;
  document.head.appendChild(s);

  // Load UAT tracking
  var u = document.createElement('script');
  u.src = '${origin}/uat.js'; u.defer = true;
  document.head.appendChild(u);
})();
</script>`;
  };

  const embedCodes = [
    {
      id: 'chatbot',
      title: 'HAVY AI Chatbot',
      description: 'Add an FAQ-powered AI chatbot with voice input to your website',
      code: getChatbotSnippet(),
      icon: MessageSquare,
      settings: {
        position: 'bottom-right',
        primaryColor: '#6366f1',
      },
    },
    {
      id: 'email',
      title: 'Email Auto-Responder',
      description: 'Automatic email responses for your contact forms',
      code: `<!-- HAVY Email Integration -->
<script>
  window.AISPEmail = {
    apiKey: 'your-api-key-here',
    autoRespond: true,
    language: 'en',
    formSelector: 'form[name="contact"]'
  };
</script>
<script src="https://cdn.aiservicespro.com/email.js"></script>`,
      icon: Globe,
      settings: {
        autoRespond: true,
        language: 'en',
        responseTime: 'instant',
      },
    },
    {
      id: 'tts',
      title: 'Text-to-Speech',
      description: 'Convert your content to natural speech',
      code: `<!-- HAVY TTS -->
<script>
  window.AISPTTS = {
    apiKey: 'your-api-key-here',
    voice: 'natural',
    speed: 1.0,
    autoDetect: true
  };
</script>
<script src="https://cdn.aiservicespro.com/tts.js"></script>
<button onclick="AISPTTS.speak('Hello world!')">Play</button>`,
      icon: Palette,
      settings: {
        voice: 'natural',
        speed: 1.0,
        autoDetect: true,
      },
    },
  ];

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600">Embed HAVY services into your website with simple code snippets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {embedCodes.map((embed) => (
          <div key={embed.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <embed.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{embed.title}</h3>
                  <p className="text-gray-600">{embed.description}</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(embed.code, embed.id)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {copiedCode === embed.id ? (
                  <><Check className="w-4 h-4 text-green-600" /><span className="text-green-600">Copied!</span></>
                ) : (
                  <><Copy className="w-4 h-4" /><span>Copy Code</span></>
                )}
              </button>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap">
                <code>{embed.code}</code>
              </pre>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Configuration Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(embed.settings).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      type={typeof value === 'boolean' ? 'checkbox' : 'text'}
                      defaultChecked={typeof value === 'boolean' ? value : undefined}
                      defaultValue={typeof value !== 'boolean' ? String(value) : undefined}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card bg-indigo-50 border border-indigo-200">
        <h3 className="text-lg font-semibold text-indigo-900 mb-2">Quick Setup Guide</h3>
        <div className="space-y-2 text-indigo-800 text-sm">
          <p>1. Copy the chatbot snippet above and paste it into your website's <code className="bg-indigo-100 px-1 py-0.5 rounded">&lt;head&gt;</code></p>
          <p>2. Replace <code className="bg-indigo-100 px-1 py-0.5 rounded">YOUR_CHATBOT_KEY</code> with the key from your <strong>Chatbot Config</strong> page</p>
          <p>3. Replace <code className="bg-indigo-100 px-1 py-0.5 rounded">Your Business Name</code> with your actual business name</p>
          <p>4. The chatbot icon and FAQ answers load automatically — no other setup needed</p>
        </div>
      </div>
    </div>
  );
};

export default Integrations;