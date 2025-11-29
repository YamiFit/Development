import { user } from "../../data/user";

export default function ProfileTab() {
  return (
    <div className="bg-white rounded-xl p-6 shadow border">
      <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="text-sm text-gray-600">Name</label>
          <input
            defaultValue={user.name}
            className="w-full mt-1 border px-3 py-2 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Email</label>
          <input
            defaultValue={user.email}
            className="w-full mt-1 border px-3 py-2 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Phone</label>
          <input
            defaultValue={user.phone}
            className="w-full mt-1 border px-3 py-2 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Gender</label>
          <select className="w-full mt-1 border px-3 py-2 rounded-lg">
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
      </div>

      <button className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg">
        Save Changes
      </button>
    </div>
  );
}
