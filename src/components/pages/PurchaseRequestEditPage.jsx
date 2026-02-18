import React, { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "../layout/HeaderBar";
import PageContainer from "../layout/PageContainer";
import { Card } from "../layout/Card";
import { auth, signOut } from "../../firebaseConfig";
import { useHotelContext } from "../../contexts/HotelContext";
import {
  getPurchaseRequestById,
  updatePurchaseRequest,
} from "../../services/firebasePurchaseRequests";
import { getAllUsers } from "../../services/firebaseUserManagement";

const PURCHASE_REQUEST_APPROVER_ROLE = "Purchase Request Approver";

const emptyItem = {
  articleNumber: "",
  name: "",
  supplier: "",
  unit: "",
  quantity: "",
  netPrice: "",
  vatPercent: "",
};

function getRolesForHotel(user, hotelUid) {
  if (!user?.roles) return [];
  if (Array.isArray(user.roles)) return user.roles;
  if (hotelUid && Array.isArray(user.roles[hotelUid])) return user.roles[hotelUid];
  return [];
}

function getUserDisplayName(user) {
  return user.name || user.displayName || user.email || user.id;
}

export default function PurchaseRequestEditPage() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const { hotelUid } = useHotelContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approvers, setApprovers] = useState([]);
  const [isApproverModalOpen, setIsApproverModalOpen] = useState(false);
  const [selectedApproverId, setSelectedApproverId] = useState("");
  const [form, setForm] = useState({
    title: "",
    requiredDeliveryDate: "",
    items: [{ ...emptyItem }],
  });

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
    async function loadRequest() {
      if (!hotelUid || !requestId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const [data, users] = await Promise.all([
        getPurchaseRequestById(hotelUid, requestId),
        getAllUsers(),
      ]);
      setApprovers(
        users.filter((user) => getRolesForHotel(user, hotelUid).includes(PURCHASE_REQUEST_APPROVER_ROLE))
      );

      if (!data) {
        setLoading(false);
        return;
      }

      setForm({
        title: data.title || "",
        requiredDeliveryDate: data.requiredDeliveryDate || "",
        items: data.items?.length ? data.items : [{ ...emptyItem }],
      });
      setSelectedApproverId(data.approverUserId || "");
      setLoading(false);
    }

    loadRequest();
  }, [hotelUid, requestId]);

  const updateItem = (index, key, value) => {
    setForm((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const addItemRow = () => {
    setForm((previous) => ({ ...previous, items: [...previous.items, { ...emptyItem }] }));
  };

  const removeItemRow = (index) => {
    setForm((previous) => {
      if (previous.items.length === 1) {
        return { ...previous, items: [{ ...emptyItem }] };
      }

      return {
        ...previous,
        items: previous.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const handleSave = async () => {
    if (!hotelUid || !requestId || !form.title.trim() || !form.requiredDeliveryDate) {
      return;
    }

    setIsApproverModalOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!hotelUid || !requestId || !selectedApproverId) {
      return;
    }

    const selectedApprover = approvers.find((user) => user.id === selectedApproverId);
    if (!selectedApprover) {
      return;
    }

    setSaving(true);
    await updatePurchaseRequest(hotelUid, requestId, {
      ...form,
      approverUserId: selectedApprover.id,
      approverName: getUserDisplayName(selectedApprover),
    });
    setSaving(false);
    navigate(`/purchase-requests/${requestId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <HeaderBar today={todayLabel} onLogout={handleLogout} />
      <PageContainer className="space-y-6">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">Purchasing</p>
          <h1 className="text-3xl font-semibold">Bewerk Purchase Request</h1>
          <p className="text-gray-600 mt-1">Pas aanvraaggegevens en items aan.</p>
        </div>

        <Card className="space-y-5">
          {loading ? (
            <p className="text-gray-600">Purchase Request laden...</p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  Title
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, title: event.target.value }))
                    }
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                  Required delivery date
                  <input
                    type="date"
                    value={form.requiredDeliveryDate}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, requiredDeliveryDate: event.target.value }))
                    }
                    className="rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-2">Article Number</th>
                      <th className="py-2 pr-2">Name</th>
                      <th className="py-2 pr-2">Supplier</th>
                      <th className="py-2 pr-2">Unit</th>
                      <th className="py-2 pr-2">Quantity</th>
                      <th className="py-2 pr-2">Net Price</th>
                      <th className="py-2 pr-2">Vat %</th>
                      <th className="py-2 pr-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, index) => (
                      <tr key={`edit-item-${index}`} className="border-t border-gray-100">
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={item.articleNumber}
                            onChange={(event) => updateItem(index, "articleNumber", event.target.value)}
                            className="rounded border border-gray-300 px-2 py-1 w-36"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(event) => updateItem(index, "name", event.target.value)}
                            className="rounded border border-gray-300 px-2 py-1 w-40"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={item.supplier}
                            onChange={(event) => updateItem(index, "supplier", event.target.value)}
                            className="rounded border border-gray-300 px-2 py-1 w-36"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(event) => updateItem(index, "unit", event.target.value)}
                            className="rounded border border-gray-300 px-2 py-1 w-24"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(event) => updateItem(index, "quantity", event.target.value)}
                            className="rounded border border-gray-300 px-2 py-1 w-24"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.netPrice}
                            onChange={(event) => updateItem(index, "netPrice", event.target.value)}
                            className="rounded border border-gray-300 px-2 py-1 w-24"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.vatPercent}
                            onChange={(event) => updateItem(index, "vatPercent", event.target.value)}
                            className="rounded border border-gray-300 px-2 py-1 w-24"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            className="text-gray-500 hover:text-red-600"
                            aria-label="Verwijder regel"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-3 justify-between">
                <button
                  type="button"
                  onClick={addItemRow}
                  className="px-3 py-2 border border-gray-300 rounded font-semibold text-sm"
                >
                  + Purchase Item toevoegen
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/purchase-requests/${requestId}`)}
                    className="px-3 py-2 border border-gray-300 rounded font-semibold text-sm"
                  >
                    Annuleren
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !form.title.trim() || !form.requiredDeliveryDate || !hotelUid}
                    className="bg-[#b41f1f] text-white px-4 py-2 rounded font-semibold text-sm disabled:opacity-60"
                  >
                    {saving ? "Opslaan..." : "Wijzigingen opslaan"}
                  </button>
                </div>
              </div>
            </>
          )}
        </Card>
      </PageContainer>

      {isApproverModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Selecteer approver</h2>
            <p className="mt-1 text-sm text-gray-600">
              Enkel gebruikers met de rol &quot;Purchase Request Approver&quot; kunnen worden geselecteerd.
            </p>

            <label className="mt-4 flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Approver
              <select
                value={selectedApproverId}
                onChange={(event) => setSelectedApproverId(event.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Selecteer approver</option>
                {approvers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {getUserDisplayName(user)}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsApproverModalOpen(false)}
                className="px-3 py-2 border border-gray-300 rounded font-semibold text-sm"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={!selectedApproverId || saving}
                className="bg-[#b41f1f] text-white px-4 py-2 rounded font-semibold text-sm disabled:opacity-60"
              >
                {saving ? "Opslaan..." : "Bevestigen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
