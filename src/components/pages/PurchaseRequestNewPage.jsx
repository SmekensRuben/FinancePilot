import React, { useMemo, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "../layout/HeaderBar";
import PageContainer from "../layout/PageContainer";
import { Card } from "../layout/Card";
import { auth, signOut } from "../../firebaseConfig";
import { useHotelContext } from "../../contexts/HotelContext";
import { createPurchaseRequest } from "../../services/firebasePurchaseRequests";
import {
  addItemToPurchaseRequestList,
  getPurchaseRequestLists,
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

function toItemOptionLabel(item) {
  return [item.articleNumber, item.name, item.supplier].filter(Boolean).join(" - ");
}

export default function PurchaseRequestNewPage() {
  const navigate = useNavigate();
  const { hotelUid } = useHotelContext();
  const [saving, setSaving] = useState(false);
  const [purchaseRequestLists, setPurchaseRequestLists] = useState([]);
  const [selectedItemsByIndex, setSelectedItemsByIndex] = useState({});
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState("");
  const [addingItemsToList, setAddingItemsToList] = useState(false);
  const [itemComboboxValue, setItemComboboxValue] = useState("");
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

  const selectedItemIndexes = Object.entries(selectedItemsByIndex)
    .filter(([, isSelected]) => isSelected)
    .map(([index]) => Number(index));

  const purchaseListItems = useMemo(() => {
    const seen = new Set();
    const merged = [];

    purchaseRequestLists.forEach((list) => {
      (list.items || []).forEach((item) => {
        const key = JSON.stringify({
          articleNumber: item.articleNumber || "",
          name: item.name || "",
          supplier: item.supplier || "",
          unit: item.unit || "",
          quantity: Number(item.quantity) || 0,
          netPrice: Number(item.netPrice) || 0,
          vatPercent: Number(item.vatPercent) || 0,
        });

        if (!seen.has(key)) {
          seen.add(key);
          merged.push({
            articleNumber: item.articleNumber || "",
            name: item.name || "",
            supplier: item.supplier || "",
            unit: item.unit || "",
            quantity: Number(item.quantity) || 0,
            netPrice: Number(item.netPrice) || 0,
            vatPercent: Number(item.vatPercent) || 0,
          });
        }
      });
    });

    return merged;
  }, [purchaseRequestLists]);

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.clear();
    window.location.href = "/login";
  };

  React.useEffect(() => {
    async function loadLists() {
      if (!hotelUid) {
        setPurchaseRequestLists([]);
        return;
      }

      const lists = await getPurchaseRequestLists(hotelUid);
      setPurchaseRequestLists(lists);
    }

    loadLists();
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

  const addItemFromCombobox = () => {
    const selected = purchaseListItems.find((item) => toItemOptionLabel(item) === itemComboboxValue);
    if (!selected) {
      return;
    }

    setForm((previous) => ({ ...previous, items: [...previous.items, { ...selected }] }));
    setItemComboboxValue("");
  };

  const removeItemRow = (index) => {
    setForm((previous) => {
      if (previous.items.length === 1) {
        return { ...previous, items: [{ ...emptyItem }] };
      }

      const nextItems = previous.items.filter((_, itemIndex) => itemIndex !== index);
      const nextSelected = {};

      Object.entries(selectedItemsByIndex).forEach(([itemIndex, isSelected]) => {
        const currentIndex = Number(itemIndex);
        if (currentIndex === index || !isSelected) {
          return;
        }

        nextSelected[currentIndex > index ? currentIndex - 1 : currentIndex] = true;
      });

      setSelectedItemsByIndex(nextSelected);

      return {
        ...previous,
        items: nextItems,
      };
    });
  };

  const toggleItemSelection = (index) => {
    setSelectedItemsByIndex((previous) => ({
      ...previous,
      [index]: !previous[index],
    }));
  };

  const handleCreate = async () => {
    if (!hotelUid || !form.title.trim() || !form.requiredDeliveryDate) {
      return;
    }

    setSaving(true);
    await createPurchaseRequest(hotelUid, form);
    setSaving(false);
    navigate("/purchase-requests");
  };

  const handleConfirmAddSelectedItems = async () => {
    if (!hotelUid || !selectedListId || selectedItemIndexes.length === 0) {
      return;
    }

    setAddingItemsToList(true);
    try {
      await Promise.all(
        selectedItemIndexes.map((itemIndex) =>
          addItemToPurchaseRequestList(hotelUid, selectedListId, form.items[itemIndex])
        )
      );
      setIsListModalOpen(false);
      setSelectedListId("");
      setSelectedItemsByIndex({});
    } finally {
      setAddingItemsToList(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <HeaderBar today={todayLabel} onLogout={handleLogout} />
      <PageContainer className="space-y-6">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">Purchasing</p>
          <h1 className="text-3xl font-semibold">Nieuwe Purchase Request</h1>
          <p className="text-gray-600 mt-1">Vul de aanvraaggegevens in en voeg Purchase Items toe.</p>
        </div>

        <Card className="space-y-5">
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
                  setForm((previous) => ({
                    ...previous,
                    requiredDeliveryDate: event.target.value,
                  }))
                }
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Purchase Item (uit bestaande Purchase Request Lists)
              <input
                list="purchase-list-items"
                value={itemComboboxValue}
                onChange={(event) => setItemComboboxValue(event.target.value)}
                placeholder="Zoek op artikelnummer, naam of leverancier"
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <datalist id="purchase-list-items">
                {purchaseListItems.map((item, index) => (
                  <option key={`${toItemOptionLabel(item)}-${index}`} value={toItemOptionLabel(item)} />
                ))}
              </datalist>
            </label>
            <button
              type="button"
              onClick={addItemFromCombobox}
              disabled={!itemComboboxValue.trim()}
              className="px-3 py-2 border border-gray-300 rounded font-semibold text-sm disabled:opacity-60"
            >
              Item via combobox toevoegen
            </button>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsListModalOpen(true)}
              disabled={selectedItemIndexes.length === 0 || purchaseRequestLists.length === 0}
              className="bg-[#b41f1f] text-white px-4 py-2 rounded font-semibold text-sm disabled:opacity-60"
            >
              Voeg item toe aan Purchase Request List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-2">Select</th>
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
                      <button
                        type="button"
                        onClick={() => toggleItemSelection(index)}
                        className={`inline-flex h-6 w-6 items-center justify-center rounded border ${
                          selectedItemsByIndex[index]
                            ? "border-[#b41f1f] bg-[#b41f1f] text-white"
                            : "border-gray-300 text-transparent"
                        }`}
                        aria-label="Selecteer item"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </td>
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
                onClick={() => navigate("/purchase-requests")}
                className="px-3 py-2 border border-gray-300 rounded font-semibold text-sm"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving || !form.title.trim() || !form.requiredDeliveryDate || !hotelUid}
                className="bg-[#b41f1f] text-white px-4 py-2 rounded font-semibold text-sm disabled:opacity-60"
              >
                {saving ? "Opslaan..." : "Purchase Request opslaan"}
              </button>
            </div>
          </div>
        </Card>
      </PageContainer>

      {isListModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Selecteer Purchase Request List</h2>
            <p className="mt-1 text-sm text-gray-600">
              {selectedItemIndexes.length} geselecteerde item(s) worden toegevoegd aan de gekozen lijst.
            </p>

            <label className="mt-4 flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Purchase Request List
              <select
                value={selectedListId}
                onChange={(event) => setSelectedListId(event.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Selecteer lijst</option>
                {purchaseRequestLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsListModalOpen(false);
                  setSelectedListId("");
                }}
                className="px-3 py-2 border border-gray-300 rounded font-semibold text-sm"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleConfirmAddSelectedItems}
                disabled={!selectedListId || addingItemsToList || selectedItemIndexes.length === 0}
                className="bg-[#b41f1f] text-white px-4 py-2 rounded font-semibold text-sm disabled:opacity-60"
              >
                {addingItemsToList ? "Toevoegen..." : "Bevestigen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
