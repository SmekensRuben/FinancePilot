import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "../layout/HeaderBar";
import PageContainer from "../layout/PageContainer";
import { Card } from "../layout/Card";
import { auth, signOut } from "../../firebaseConfig";
import { useHotelContext } from "../../contexts/HotelContext";
import { deleteUser, getAllUsers } from "../../services/firebaseUserManagement";

function getRolesForHotel(user, hotelUid) {
  if (!user?.roles) {
    return [];
  }

  if (Array.isArray(user.roles)) {
    return user.roles;
  }

  if (hotelUid && Array.isArray(user.roles[hotelUid])) {
    return user.roles[hotelUid];
  }

  return [];
}

export default function UserConfigurationPage() {
  const navigate = useNavigate();
  const { hotelUid } = useHotelContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.clear();
    window.location.href = "/login";
  };

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      setLoading(false);
    }

    loadUsers();
  }, []);

  const handleDelete = async (userId) => {
    const confirmed = window.confirm("Weet je zeker dat je deze gebruiker wilt verwijderen?");
    if (!confirmed) {
      return;
    }

    setDeletingId(userId);
    try {
      await deleteUser(userId);
      setUsers((previous) => previous.filter((user) => user.id !== userId));
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <HeaderBar today={todayLabel} onLogout={handleLogout} />
      <PageContainer className="space-y-6">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">Settings</p>
          <h1 className="text-3xl font-semibold">User Configuration</h1>
          <p className="text-gray-600 mt-1">Overzicht van alle gebruikers en hun rollen.</p>
        </div>

        <Card>
          {loading ? (
            <p className="text-gray-600">Gebruikers laden...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Roles</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const userRoles = getRolesForHotel(user, hotelUid);

                    return (
                      <tr key={user.id} className="border-b border-gray-100">
                        <td className="py-2 pr-3">{user.name || user.displayName || "-"}</td>
                        <td className="py-2 pr-3">{user.email || "-"}</td>
                        <td className="py-2 pr-3">{userRoles.length ? userRoles.join(", ") : "-"}</td>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/settings/user-configuration/${user.id}/edit`)}
                              className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 font-semibold"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(user.id)}
                              disabled={deletingId === user.id}
                              className="inline-flex items-center gap-1 rounded border border-red-300 px-2 py-1 font-semibold text-red-700 disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              {deletingId === user.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </PageContainer>
    </div>
  );
}
