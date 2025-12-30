/**
 * Upgrade Page
 * Shows when BASIC users try to access PRO-only features
 */

import { useLocation, useNavigate, Link } from "react-router-dom";
import { FiArrowLeft, FiStar, FiCheck, FiLock } from "react-icons/fi";
import Layout from "@/components/layout/Layout";
import { USER_PLANS, ROUTES } from "@/config/constants";

const proFeatures = [
  {
    title: "Daily Tracker",
    description: "Track your meals, calories, and macros with detailed analytics",
    icon: "📊",
  },
  {
    title: "Chatting with Coaches",
    description: "Get personalized guidance from professional fitness coaches",
    icon: "💬",
  },
  {
    title: "Progress Analytics",
    description: "Visualize your fitness journey with charts and insights",
    icon: "📈",
  },
  {
    title: "Coach Selection",
    description: "Choose from our network of certified coaches",
    icon: "🏋️",
  },
  {
    title: "Priority Support",
    description: "Get faster responses and dedicated assistance",
    icon: "⚡",
  },
  {
    title: "Advanced Reports",
    description: "Export detailed health and nutrition reports",
    icon: "📋",
  },
];

export default function Upgrade() {
  const location = useLocation();
  const navigate = useNavigate();
  const { from, requiredPlan, currentPlan } = location.state || {};

  const handleGoBack = () => {
    navigate(ROUTES.DASHBOARD);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <FiArrowLeft />
          <span>Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
            <FiLock className="text-lg" />
            <span>PRO Feature Required</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Upgrade to PRO
          </h1>
          
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Unlock powerful features to supercharge your fitness journey. 
            Get access to coaches, advanced tracking, and personalized insights.
          </p>

          {from && (
            <p className="mt-4 text-sm text-gray-500">
              You were trying to access: <span className="font-medium">{from.pathname}</span>
            </p>
          )}
        </div>

        {/* Current Plan Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Your Current Plan</p>
              <p className="text-xl font-semibold text-gray-800">
                {currentPlan || USER_PLANS.BASIC}
              </p>
            </div>
            <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">
              Limited Access
            </span>
          </div>
        </div>

        {/* PRO Plan Card */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-8 text-white mb-10 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <FiStar className="text-yellow-400 text-xl" />
              <span className="text-xl font-bold">PRO Plan</span>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-bold">$9.99</span>
              <span className="text-purple-200 ml-2">/month</span>
            </div>
            
            <p className="text-purple-100 mb-6">
              Everything in BASIC, plus advanced features to accelerate your results.
            </p>

            <button
              className="w-full bg-white text-purple-700 py-3 px-6 rounded-xl font-semibold hover:bg-purple-50 transition-colors shadow-lg"
              onClick={() => {
                // TODO: Implement actual upgrade flow
                alert('Upgrade flow coming soon! Contact support to upgrade your plan.');
              }}
            >
              Upgrade Now
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          What's Included in PRO
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {proFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4 hover:shadow-md transition-shadow"
            >
              <span className="text-3xl">{feature.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-10">
          <div className="p-6 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Plan Comparison</h3>
          </div>
          
          <div className="divide-y">
            <ComparisonRow feature="Browse Meals" basic pro />
            <ComparisonRow feature="Place Orders" basic pro />
            <ComparisonRow feature="View Subscriptions" basic pro />
            <ComparisonRow feature="Order History" basic pro />
            <ComparisonRow feature="Daily Tracker" basic={false} pro />
            <ComparisonRow feature="Progress Charts" basic={false} pro />
            <ComparisonRow feature="Chat with Coaches" basic={false} pro />
            <ComparisonRow feature="Coach Selection" basic={false} pro />
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pb-10">
          <p className="text-gray-600 mb-4">
            Have questions? <Link to="/settings" className="text-purple-600 hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}

function ComparisonRow({ feature, basic, pro }) {
  return (
    <div className="flex items-center justify-between p-4">
      <span className="text-gray-700">{feature}</span>
      <div className="flex items-center gap-8">
        <div className="w-20 text-center">
          {basic ? (
            <FiCheck className="inline text-green-600 text-lg" />
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </div>
        <div className="w-20 text-center">
          {pro ? (
            <FiCheck className="inline text-purple-600 text-lg" />
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </div>
      </div>
    </div>
  );
}
