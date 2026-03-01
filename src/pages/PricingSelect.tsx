import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard } from 'lucide-react';
import { useDictationCapture } from '../hooks/useDictationCapture';


const PricingSelect: React.FC = () => {
  useDictationCapture();
  const navigate = useNavigate();
 
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      period: 'month',
      description: 'Perfect for small businesses getting started',
      features: [
        '1,000 chatbot interactions/month',
        'Basic email auto-responder',
        '100 text-to-speech conversions',
        'Standard support',
        'Basic analytics',
        '1 domain integration'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 99,
      period: 'month',
      description: 'Ideal for growing businesses',
      features: [
        '10,000 chatbot interactions/month',
        'Advanced email auto-responder',
        '1,000 text-to-speech conversions',
        'Speech translation (5 languages)',
        'Priority support',
        'Advanced analytics & insights',
        '5 domain integrations',
        'Custom branding'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      period: 'month',
      description: 'For large organizations with custom needs',
      features: [
        'Unlimited chatbot interactions',
        'Enterprise email automation',
        'Unlimited text-to-speech',
        'Speech translation (25+ languages)',
        '24/7 dedicated support',
        'Real-time analytics dashboard',
        'Unlimited domain integrations',
        'White-label solutions',
        'Custom AI model training',
        'SSO & advanced security'
      ]
    }
  ];

  const handlePlanSelect = (planId: string) => {
    // Mock payment processing
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen gradient-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your business needs. You can upgrade or downgrade at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-white border-2 border-blue-500 shadow-2xl scale-105'
                  : 'bg-white border border-gray-200 shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Recommended
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600 ml-1">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelect(plan.id)}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-semibold transition-colors duration-200 ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Select Plan</span>
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            All plans include a 14-day free trial. No setup fees. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingSelect;