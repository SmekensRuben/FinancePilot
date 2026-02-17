import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import HeaderBar from "../layout/HeaderBar";
import PageContainer from "../layout/PageContainer";
import { Card } from "../layout/Card";
import { auth, signOut } from "../../firebaseConfig";
import { useHotelContext } from "../../contexts/HotelContext";
import {
  createPurchaseRequest,
  getPurchaseRequests,
} from "../../services/firebasePurchaseRequests";

const emptyItem = {
  articleNumber: "",
  name: "",
  supplier: "",
  unit: "",
  quantity: "",
  netPrice: "",
  vatPercent: "",
};

export default function PurchaseRequestsPage() {
  const { hotelUid } = useHotelContext();
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const loadPurchaseRequests = async () => {
    if (!hotelUid) {
      setPurchaseRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await getPurchaseRequests(hotelUid);
    setPurchaseRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPurchaseRequests();
  }, [hotelUid]);

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

  const handleCreate = async () => {
    if (!form.title.trim() || !form.requiredDeliveryDate) {
      return;
    }

    setSaving(true);
    await createPurchaseRequest(hotelUid, form);
    setForm({ title: "", requiredDeliveryDate: "", items: [{ ...emptyItem }] });
    setIsCreateOpen(false);
    setSaving(false);
    await loadPurchaseRequests();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <HeaderBar today={todayLabel} onLogout={handleLogout} />
      <PageContainer className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">Purchasing</p>
            <h1 className="text-3xl font-semibold">Purchase Requests</h1>
            <p className="text-gray-600 mt-1">Beheer en maak nieuwe Purchase Requests aan.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#b41f1f] text-white px-4 py-2 rounded font-semibold shadow hover:bg-[#961919] transition-colors inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nieuwe Purchase Request
          </button>
        </div>

        <Card>
          {loading ? (
            <p className="text-gray-600">Purchase Requests laden...</p>
          ) : purchaseRequests.length === 0 ? (
            <p className="text-gray-600">Er zijn nog geen Purchase Requests.</p>
          ) : (
            <div className="space-y-4">
              {purchaseRequests.map((request) => (
                <div key={request.id} className="rounded border border-gray-200 p-4 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">{request.title}</h2>
                    <span className="text-sm text-gray-600">
                      Required delivery date: {request.requiredDeliveryDate}
                    </span>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="py-2 pr-4">Article Number</th>
                          <th className="py-2 pr-4">Name</th>
                          <th className="py-2 pr-4">Supplier</th>
                          <th className="py-2 pr-4">Unit</th>
                          <th className="py-2 pr-4">Quantity</th>
                          <th className="py-2 pr-4">Net Price</th>
                          <th className="py-2 pr-4">Vat %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {request.items.map((item, index) => (
                          <tr key={`${request.id}-item-${index}`} className="border-t border-gray-100">
                            <td className="py-2 pr-4">{item.articleNumber}</td>
                            <td className="py-2 pr-4">{item.name}</td>
                            <td className="py-2 pr-4">{item.supplier}</td>
                            <td className="py-2 pr-4">{item.unit}</td>
                            <td className="py-2 pr-4">{item.quantity}</td>
                            <td className="py-2 pr-4">{item.netPrice}</td>
                            <td className="py-2 pr-4">{item.vatPercent}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageContainer>

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 p-4" onClick={() => setIsCreateOpen(false)}>
          <div
            className="max-w-6xl w-full mx-auto mt-8 bg-white rounded-lg shadow-lg p-5 max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-xl font-semibold">Nieuw Purchase Request</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                    setForm((previous) => ({
                      ...previous,
                      requiredDeliveryDate: event.target.value,
                    }))
                  }
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="mt-5 overflow-x-auto">
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
                    <tr key={`new-item-${index}`} className="border-t border-gray-100">
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={item.articleNumber}
                          onChange={(event) =>
                            updateItem(index, "articleNumber", event.target.value)
                          }
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
                          onChange={(event) =>
                            updateItem(index, "supplier", event.target.value)
                          }
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
                          onChange={(event) =>
                            updateItem(index, "quantity", event.target.value)
                          }
                          className="rounded border border-gray-300 px-2 py-1 w-24"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.netPrice}
                          onChange={(event) =>
                            updateItem(index, "netPrice", event.target.value)
                          }
                          className="rounded border border-gray-300 px-2 py-1 w-24"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.vatPercent}
                          onChange={(event) =>
                            updateItem(index, "vatPercent", event.target.value)
                          }
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

            <div className="mt-4 flex flex-wrap gap-3 justify-between">
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
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-2 border border-gray-300 rounded font-semibold text-sm"
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={saving || !form.title.trim() || !form.requiredDeliveryDate}
                  className="bg-[#b41f1f] text-white px-4 py-2 rounded font-semibold text-sm disabled:opacity-60"
                >
                  {saving ? "Opslaan..." : "Purchase Request opslaan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
