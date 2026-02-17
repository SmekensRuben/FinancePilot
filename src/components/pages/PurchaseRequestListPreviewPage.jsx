import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "../layout/HeaderBar";
import PageContainer from "../layout/PageContainer";
import { Card } from "../layout/Card";
import { auth, signOut } from "../../firebaseConfig";
import { useHotelContext } from "../../contexts/HotelContext";
import {
  deletePurchaseRequestList,
  getPurchaseRequestListById,
} from "../../services/firebasePurchaseRequestLists";

export default function PurchaseRequestListPreviewPage() {
  const navigate = useNavigate();
  const { listId } = useParams();
  const { hotelUid } = useHotelContext();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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
        setList(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await getPurchaseRequestListById(hotelUid, listId);
      setList(data);
      setLoading(false);
    }

    loadList();
  }, [hotelUid, listId]);

  const handleDelete = async () => {
    if (!hotelUid || !listId) {
      return;
    }

    setDeleting(true);
    try {
      await deletePurchaseRequestList(hotelUid, listId);
      navigate("/purchase-request-lists");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <HeaderBar today={todayLabel} onLogout={handleLogout} />
      <PageContainer className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">Requisition</p>
            <h1 className="text-3xl font-semibold">Purchase Request List Preview</h1>
            <p className="text-gray-600 mt-1">Bekijk en beheer de geselecteerde Purchase Request List.</p>
          </div>
          {list && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/purchase-request-lists/${list.id}/edit`)}
                className="px-3 py-2 border border-gray-300 rounded font-semibold text-sm inline-flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 bg-red-600 text-white rounded font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>

        <Card>
          {loading ? (
            <p className="text-gray-600">Purchase Request List laden...</p>
          ) : !list ? (
            <p className="text-gray-600">Purchase Request List niet gevonden.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold text-gray-900">{list.title}</h2>
                <span className="text-sm text-gray-600">{list.items.length} items</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200">
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
                    {list.items.map((item, index) => (
                      <tr key={`${list.id}-item-${index}`} className="border-b border-gray-100">
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
          )}
        </Card>
      </PageContainer>
    </div>
  );
}
