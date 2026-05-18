import React, { useCallback, useEffect, useState } from "react";
import { Users, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { clubService } from "../services/api";

const Clubs = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
  });

  const canManage = user?.role === "admin" || user?.role === "moderator";

  const fetchClubs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      const response = await clubService.getAll(params);
      setClubs(response.data.clubs);
    } catch (error) {
      console.error("Clubs fetch error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch clubs");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await clubService.create(form);
      toast.success("Club created");
      setForm({ name: "", category: "", description: "" });
      setShowCreate(false);
      fetchClubs();
    } catch (error) {
      console.error("Club create error:", error);
      toast.error(error.response?.data?.message || "Failed to create club");
    }
  };

  const handleMembership = async (club) => {
    try {
      if (club.isMember) {
        await clubService.leave(club._id);
        toast.success("Left club");
      } else {
        await clubService.join(club._id);
        toast.success("Joined club");
      }
      fetchClubs();
    } catch (error) {
      console.error("Club membership error:", error);
      toast.error(error.response?.data?.message || "Failed to update membership");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Campus Clubs</h2>
          <p className="text-gray-600 mt-1">
            Explore and join student organizations
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate((value) => !value)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Create Club
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search clubs..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl shadow-md p-6 space-y-4"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Club name"
              className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
              placeholder="Category"
              className="px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder="Description"
            rows="3"
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Save Club
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : clubs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Users className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            No clubs found
          </h3>
          <p className="text-gray-600">
            Clubs created by admins or moderators will appear here.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {clubs.map((club) => (
            <div
              key={club._id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Users size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                {club.name}
              </h3>
              <p className="text-gray-500 text-center text-xs uppercase tracking-wide mb-2">
                {club.category || "General"}
              </p>
              <p className="text-gray-600 text-center text-sm mb-4 min-h-12">
                {club.description}
              </p>
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-2xl font-bold text-blue-600">
                  {club.memberCount}
                </p>
                <p className="text-xs text-gray-500">Members</p>
              </div>
              <button
                onClick={() => handleMembership(club)}
                className={`mt-4 w-full py-2 rounded-lg transition font-medium ${
                  club.isMember
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {club.isMember ? "Leave Club" : "Join Club"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clubs;
