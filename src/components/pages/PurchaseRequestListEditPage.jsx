import React, { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "../layout/HeaderBar";
import PageContainer from "../layout/PageContainer";
import { Card } from "../layout/Card";
import { auth, signOut } from "../../firebaseConfig";
import { useHotelContext } from "../../contexts/HotelContext";
import {
  getPurchaseRequestListById,
  updatePurchaseRequestList,
} from "../../services/firebasePurchaseRequestLists";

const emptyItem = {
  articleNumber: "",
  name: "",
  supplier: "",
  unit: "",
  quantity: "",
  netPrice: "",
  vatPercent: "",
};

export default function PurchaseRequestListEditPage() {
  const navigate = useNavigate();
  const { listId } = useParams();
  const { hotelUid } = useHotelContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", items: [{ ...emptyItem }] });

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
    async function loadList() {
      if (!hotelUid || !listId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await getPurchaseRequestListById(hotelUid, listId);
      if (!data) {
        setLoading(false);
        return;
      }

      setForm({
        title: data.title || "",
        items: data.items?.length ? data.items : [{ ...emptyItem }],
      });
      setLoading(false);
    }

    loadList();
  }, [hotelUid, listId]);

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
    if (!hotelUid || !listId || !form.title.trim()) {
      return;
    }

    setSaving(true);
    await updatePurchaseRequestList(hotelUid, listId, form);
    setSaving(false);
    navigate(`/purchase-request-lists/${listId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <HeaderBar today={todayLabel} onLogout={handleLogout} />
      <PageContainer className="space-y-6">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">Requisition</p>
          <h1 className="text-3xl font-semibold">Bewerk Purchase Request List</h1>
          <p className="text-gray-600 mt-1">Pas lijstgegevens en items aan.</p>
        </div>

        <Card className="space-y-5">
          {loading ? (
            <p className="text-gray-600">Purchase Request List laden...</p>
          ) : (
            <>
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 sm:max-w-md">
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
                      <tr key={`edit-list-item-${index}`} className="border-t border-gray-100">
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
                    onClick={() => navigate(`/purchase-request-lists/${listId}`)}
                    className="px-3 py-2 border border-gray-300 rounded font-semibold text-sm"
                  >
                    Annuleren
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !form.title.trim() || !hotelUid}
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
    </div>
  );
}
