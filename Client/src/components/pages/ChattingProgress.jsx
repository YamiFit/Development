/**
 * Chatting Page - PRO Feature (Placeholder)
 * Replaces the old Progress page
 * Route: /progress
 */

import Layout from "../layout/Layout";
import { FiMessageCircle, FiUsers, FiStar, FiZap } from "react-icons/fi";
import { Link } from "react-router-dom";
import { ROUTES } from "@/config/constants";

export default function ChattingProgress() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
            <FiMessageCircle className="text-4xl text-purple-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Chatting
          </h1>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
            <FiStar />
            <span>PRO Feature</span>
          </div>
          
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Connect with your coach and get personalized guidance on your fitness journey.
            Real-time chat coming soon!
          </p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-8 text-white text-center mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <FiZap className="text-5xl mx-auto mb-4 text-purple-200" />
            <h2 className="text-2xl font-bold mb-3">Coming Soon</h2>
            <p className="text-purple-100 mb-6 max-w-md mx-auto">
              We're building an amazing chat experience for you and your coach.
              Stay tuned for updates!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={ROUTES.TRACKER}
                className="px-6 py-3 bg-white text-purple-700 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                Find a Coach
              </Link>
              <Link
                to={ROUTES.DASHBOARD}
                className="px-6 py-3 border border-white/30 text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          What to Expect
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <FeatureCard 
            icon="💬"
            title="Real-time Messaging"
            description="Chat directly with your coach anytime, anywhere."
          />
          <FeatureCard 
            icon="📊"
            title="Progress Sharing"
            description="Share your health metrics and get feedback."
          />
          <FeatureCard 
            icon="📸"
            title="Photo Updates"
            description="Send progress photos and meal pictures for review."
          />
          <FeatureCard 
            icon="🎯"
            title="Goal Setting"
            description="Set and track goals together with your coach."
          />
        </div>
      </div>
    </Layout>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
