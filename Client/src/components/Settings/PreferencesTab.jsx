import { user } from "../../data/user";

export default function PreferencesTab() {
  return (
    <div className="bg-white rounded-xl p-6 shadow border">
      <h2 className="text-xl font-semibold mb-4">Preferences</h2>

      <div className="mb-4">
        <label className="text-sm text-gray-600">Unit System</label>
        <select
          defaultValue={user.unitSystem}
          className="w-full mt-1 border px-3 py-2 rounded-lg"
        >
          <option value="metric">Metric (kg / cm)</option>
          <option value="imperial">Imperial (lbs / inches)</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-600">Theme</label>
        <select className="w-full mt-1 border px-3 py-2 rounded-lg">
          <option>Light</option>
          <option>Dark</option>
        </select>
      </div>

      <button className="bg-green-600 text-white px-6 py-2 rounded-lg">
        Save
      </button>
    </div>
  );
}
