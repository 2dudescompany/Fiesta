import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Mail, Volume2, Globe, ArrowRight, Star } from 'lucide-react';
import { getTimeTheme } from "../../utils/timeTheme";


const Hero: React.FC = () => {
  const features = [
    {
      icon: MessageSquare,
      title: 'Smart Chatbot',
      description: 'Domain-specific AI chatbot with multilingual support'
    },
    {
      icon: Mail,
      title: 'Email Auto-Responder',
      description: 'Intelligent email responses powered by AI'
    },
    {
      icon: Volume2,
      title: 'Text-to-Speech',
      description: 'Natural voice synthesis for better accessibility'
    },
    {
      icon: Globe,
      title: 'User Attention Tracker',
      description: 'Know the interests of your users on your website'
    }
  ];

  return (
    <section className="gradient-bg py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center fade-in">
          <div className="flex justify-center items-center space-x-1 mb-4">
            <div className="flex">
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="shimmer-text">Sophisticate</span> Your Website with
            <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent"> AI Services</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get a little helping hand for your commercial website with chatbot, on-cursor dictation
            and traffic tracking features
          </p>
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 slide-up">
          {features.map((feature, index) => (
            <div key={index} className="card text-center hover:scale-105 transition-transform duration-300">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;