import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Mail, Volume2, Code, Settings, BarChart3, CreditCard, Building2, Mouse } from 'lucide-react';
import { Eye } from 'lucide-react'; // add icon

const Sidebar: React.FC = () => {
  const navItems = [
    //{ to: '/dashboard/business', icon: Building2, label: 'Business' },
    { to: '/dashboard', icon: Home, label: 'Dashboard', end: true },
    //{ to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/dashboard/chatbot', icon: MessageSquare, label: 'Chatbot' },
    { to: '/dashboard/email', icon: Mail, label: 'Email Responder' },
    { to: '/dashboard/tts', icon: Volume2, label: 'Text-to-Speech' },
    { to: '/dashboard/uat', icon: Mouse, label: 'User Attention' },
    { to: '/dashboard/integrations', icon: Code, label: 'Integrations' },
    { to: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
    { to: '/dashboard/settings', icon: Settings, label: 'Settings' },

  ];

  return (
    <aside className="w-64 bg-white border-r bg-gradient-to-b from-black-100 to-zinc-100 border-gray-200 min-h-screen ">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center cursor-pointer hover:shadow-lg space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;