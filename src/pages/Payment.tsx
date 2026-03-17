import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { useTimeTheme } from '../hooks/useTimeTheme';

const Payment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const theme = useTimeTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  
  const planId = searchParams.get('plan') || 'unknown';

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500 flex flex-col items-center justify-center ${isDark ? 'bg-black text-white' : 'gradient-bg text-gray-900'}`}>
      <div className={`max-w-md w-full p-8 rounded-2xl shadow-xl text-center ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
        <CreditCard className="w-16 h-16 text-blue-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Complete Payment</h1>
        <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          You selected the <strong>{planId.toUpperCase()}</strong> plan.
        </p>
        
        <div className={`p-4 rounded-xl mb-8 border border-dashed ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
          <p className="text-sm font-semibold mb-2">Razorpay Integration Placeholder</p>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Integrate the Razorpay SDK or payment link logic here.
          </p>
        </div>

        <button 
          onClick={() => navigate(-1)}
          className={`flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-lg transition-colors text-sm ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    </div>
  );
};

export default Payment;
