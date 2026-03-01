import React from 'react';
import { Check, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Pricing: React.FC = () => {
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 2499,
      period: 'month',
      description: 'Perfect for small businesses getting started',
      features: [
        '1,000 chatbot interactions/month',
        'Basic email auto-responder',
        '100 text-to-speech conversions',
        'Standard support',
        'Basic analytics',
        '1 domain integration'
      ],
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 7999,
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
      price: 24999,
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
      ],
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Scale your AI services as your business grows. All plans include our core features with no setup fees.
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
                  <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>The Deal Is Big</span>
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">₹{plan.price.toLocaleString('en-IN')}</span>
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

              <Link
                to="/signup"
                className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors duration-200 ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;