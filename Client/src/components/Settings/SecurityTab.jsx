export default function SecurityTab() {
  return (
    <div className="bg-white rounded-xl p-6 shadow border">
      <h2 className="text-xl font-semibold mb-4">Security</h2>

      <div className="mb-4">
        <label className="text-sm text-gray-600">Current Password</label>
        <input
          type="password"
          className="w-full mt-1 border px-3 py-2 rounded-lg"
        />
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-600">New Password</label>
        <input
          type="password"
          className="w-full mt-1 border px-3 py-2 rounded-lg"
        />
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-600">Confirm Password</label>
        <input
          type="password"
          className="w-full mt-1 border px-3 py-2 rounded-lg"
        />
      </div>

      <button className="bg-green-600 text-white px-6 py-2 rounded-lg">
        Update Password
      </button>
    </div>
  );
}
