import Layout from "../layout/Layout";
import { orders } from "../../data/orders";
import OrderCard from "../Orders/OrderCard";

export default function Orders() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Your Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}

        {orders.length === 0 && (
          <p className="text-gray-500 text-center">No orders found.</p>
        )}
      </div>
    </Layout>
  );
}
