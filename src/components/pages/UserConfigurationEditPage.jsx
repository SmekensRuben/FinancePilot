import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "../layout/HeaderBar";
import PageContainer from "../layout/PageContainer";
import { Card } from "../layout/Card";
import { auth, db, doc, getDoc, signOut } from "../../firebaseConfig";
import { useHotelContext } from "../../contexts/HotelContext";
import { ROLE_PERMISSIONS } from "../../constants/roles";
import { updateUserRoles } from "../../services/firebaseUserManagement";

function getRolesForHotel(userData, hotelUid) {
  if (!userData?.roles) {
    return [];
  }

  if (Array.isArray(userData.roles)) {
    return userData.roles;
  }

  if (hotelUid && Array.isArray(userData.roles[hotelUid])) {
    return userData.roles[hotelUid];
  }

  return [];
}

export default function UserConfigurationEditPage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { hotelUid } = useHotelContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const availableRoles = useMemo(() => Object.keys(ROLE_PERMISSIONS), []);

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.clear();
    window.location.href = "/login";
  };

  useEffect(() => {
    async function loadUser() {
      if (!userId) {
        return;
      }

      setLoading(true);
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        setEmail(userData.email || "");
        setSelectedRoles(getRolesForHotel(userData, hotelUid));
      }

      setLoading(false);
    }

    loadUser();
  }, [hotelUid, userId]);

  const toggleRole = (role) => {
    setSelectedRoles((previous) =>
      previous.includes(role)
        ? previous.filter((item) => item !== role)
        : [...previous, role]
    );
  };

  const handleSave = async () => {
    if (!userId) {
      return;
    }

    setSaving(true);
    await updateUserRoles(userId, hotelUid, selectedRoles);
    setSaving(false);
    navigate("/settings/user-configuration");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <HeaderBar today={todayLabel} onLogout={handleLogout} />
      <PageContainer className="space-y-6">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">Settings</p>
          <h1 className="text-3xl font-semibold">Edit User Configuration</h1>
          <p className="text-gray-600 mt-1">Ken rollen toe of verwijder rollen voor deze gebruiker.</p>
        </div>

        <Card className="space-y-4">
          {loading ? (
            <p className="text-gray-600">Gebruiker laden...</p>
          ) : (
            <>
              <div className="text-sm text-gray-700">
                <span className="font-semibold">User:</span> {email || userId}
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {availableRoles.map((role) => (
                  <label
                    key={role}
                    className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/settings/user-configuration")}
                  className="px-3 py-2 border border-gray-300 rounded font-semibold text-sm"
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#b41f1f] text-white px-4 py-2 rounded font-semibold text-sm disabled:opacity-60"
                >
                  {saving ? "Opslaan..." : "Rollen opslaan"}
                </button>
              </div>
            </>
          )}
        </Card>
      </PageContainer>
    </div>
  );
}
