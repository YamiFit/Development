export const currentSubscription = {
  plan: "Pro Plan",
  renewDate: "December 15, 2025",
  status: "active",
  price: "$19.99/month"
};

export const availablePlans = [
  {
    name: "Basic Plan",
    price: "$9.99",
    period: "month",
    features: [
      "Calorie tracking",
      "500+ meal database",
      "Weekly progress reports",
      "Mobile app access"
    ],
    recommended: false
  },
  {
    name: "Pro Plan",
    price: "$19.99",
    period: "month",
    features: [
      "Everything in Basic",
      "Personalized meal plans",
      "Coaching chat access",
      "Advanced analytics",
      "Priority support"
    ],
    recommended: true
  },
  {
    name: "Elite Plan",
    price: "$39.99",
    period: "month",
    features: [
      "Everything in Pro",
      "1-on-1 coaching sessions",
      "Meal delivery tracking",
      "Custom diet plans",
      "24/7 support"
    ],
    recommended: false
  },
  {
    name: "Annual Pro",
    price: "$199.99",
    period: "year",
    features: [
      "All Pro features",
      "Save 17% annually",
      "Free nutrition guide",
      "Exclusive recipes",
      "Priority customer support"
    ],
    recommended: false
  }
];
