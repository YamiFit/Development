export const orders = [
  {
    id: 1,
    orderNumber: '#ORD-2024-001',
    date: '2024-11-25',
    status: 'delivered',
    total: 45.99,
    items: [
      { name: 'Grilled Chicken Meal', quantity: 2, price: 12.99 },
      { name: 'Quinoa Salad Bowl', quantity: 1, price: 9.99 },
      { name: 'Protein Shake', quantity: 2, price: 5.99 }
    ]
  },
  {
    id: 2,
    orderNumber: '#ORD-2024-002',
    date: '2024-11-27',
    status: 'preparing',
    total: 32.50,
    items: [
      { name: 'Salmon with Vegetables', quantity: 1, price: 15.99 },
      { name: 'Brown Rice Bowl', quantity: 2, price: 8.25 }
    ]
  },
  {
    id: 3,
    orderNumber: '#ORD-2024-003',
    date: '2024-11-28',
    status: 'pending',
    total: 28.99,
    items: [
      { name: 'Turkey Wrap', quantity: 2, price: 11.50 },
      { name: 'Fresh Juice', quantity: 2, price: 3.49 }
    ]
  }
];
