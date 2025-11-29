// pricingPlansData.js

export const pricingPlans = [
  {
    name: "Basic",
    price: { monthly: "$0", annual: "$0" },
    description: "Perfect for beginners starting their wellness journey.",
    features: [
      "Calorie tracking",
      "Basic nutrition insights",
      "10,000+ food database",
      "Daily meal logging",
      "Email support"
    ],
    buttonText: "Get Started"
  },
  {
    name: "Pro",
    price: { monthly: "$19", annual: "$15" },
    description: "Designed for active users seeking personalized guidance.",
    features: [
      "Everything in Basic",
      "AI-powered meal planning",
      "Personalized diet plans",
      "Macro tracking & analysis",
      "Recipe recommendations",
      "Progress analytics",
      "Priority support"
    ],
    highlighted: true,
    buttonText: "Start 7-Day Free Trial"
  },
  {
    name: "Premium",
    price: { monthly: "$49", annual: "$39" },
    description: "Comprehensive solution with expert coaching support.",
    features: [
      "Everything in Pro",
      "1-on-1 certified coach sessions",
      "Custom meal plans",
      "Workout integration",
      "Advanced health metrics",
      "24/7 premium support",
      "Nutritionist consultations",
      "Custom reporting",
    ],
    buttonText: "Start Free Trial"
  }
];




