import React, { useState } from 'react';
import { Copy, Check, Code, Globe, Palette, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Integrations: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { user } = useAuth();

  const getChatbotSnippet = () => {
    const saved = localStorage.getItem('chatbot_config');
    let config = {
      rasaServerUrl: import.meta.env.VITE_RASA_SERVER_URL || 'http://localhost:5005',
      position: 'bottom-right',
      primaryColor: '#3B82F6'
    };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        config = { ...config, ...parsed };
      } catch (e) {
        // Use defaults
      }
    }

    return `<!-- HAVY Rasa Chatbot Widget -->
<div id="havy-chatbot-root"></div>
<script>
  (function() {
    window.HAVYChatbotConfig = {
      chatbotKey: '${user?.chatbot_key}'
      userId: '${user?.id || 'user'}',
      position: '${config.position}',
      primaryColor: '${config.primaryColor}'
    };
    var script = document.createElement('script');
    script.src = '${window.location.origin}/chatbot-widget.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;
  };

  const embedCodes = [
    {
      id: 'chatbot',
      title: 'Rasa Chatbot',
      description: 'Add a Rasa-powered intelligent chatbot to your website',
      code: getChatbotSnippet(),
      icon: MessageSquare,
      settings: {
        'Rasa Server URL': import.meta.env.VITE_RASA_SERVER_URL || 'http://localhost:5005',
        position: 'bottom-right',
        primaryColor: '#3B82F6'
      }
    },
    {
      id: 'email',
      title: 'Email Auto-Responder',
      description: 'Automatic email responses for your contact forms',
      code: `<!-- AI Services Pro Email Integration -->
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
        responseTime: 'instant'
      }
    },
    {
      id: 'tts',
      title: 'Text-to-Speech',
      description: 'Convert your content to natural speech',
      code: `<!-- AI Services Pro TTS -->
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
        autoDetect: true
      }
    }
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
          <p className="text-gray-600">Embed AI services into your website with simple code snippets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {embedCodes.map((embed) => (
          <div key={embed.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <embed.icon className="w-5 h-5 text-blue-600" />
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
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <pre className="text-green-400 text-sm overflow-x-auto">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Integration Guide</h3>
        <div className="space-y-2 text-blue-800">
          <p>1. Replace <code className="bg-blue-100 px-2 py-1 rounded">your-api-key-here</code> with your actual API key</p>
          <p>2. Customize the configuration options as needed</p>
          <p>3. Add the code snippet to your website's HTML</p>
          <p>4. Test the integration and monitor usage in your dashboard</p>
        </div>
      </div>
    </div>
  );
};

export default Integrations;