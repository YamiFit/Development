import { user } from "../../data/user";

export default function NotificationsTab() {
  const n = user.notifications;

  return (
    <div className="bg-white rounded-xl p-6 shadow border">
      <h2 className="text-xl font-semibold mb-4">Notifications</h2>

      <div className="space-y-4">
        <label className="flex items-center gap-3">
          <input type="checkbox" defaultChecked={n.email} />
          Email Notifications
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" defaultChecked={n.push} />
          Push Notifications
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" defaultChecked={n.coaching} />
          Coaching Alerts
        </label>
      </div>

      <button className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg">
        Save Preferences
      </button>
    </div>
  );
}
