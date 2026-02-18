import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "../layout/HeaderBar";
import PageContainer from "../layout/PageContainer";
import { Card } from "../layout/Card";
import { auth, signOut } from "../../firebaseConfig";
import { useHotelContext } from "../../contexts/HotelContext";
import {
  deletePurchaseRequest,
  getPurchaseRequests,
} from "../../services/firebasePurchaseRequests";

export default function PurchaseRequestsPage() {
  const navigate = useNavigate();
  const { hotelUid } = useHotelContext();
  const [purchaseRequests, setPurchaseRequests] = useState([]);
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

  const loadPurchaseRequests = React.useCallback(async () => {
    if (!hotelUid) {
      setPurchaseRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await getPurchaseRequests(hotelUid);
    setPurchaseRequests(data);
    setLoading(false);
  }, [hotelUid]);

  useEffect(() => {
    loadPurchaseRequests();
  }, [loadPurchaseRequests]);

  const handleDelete = async (event, requestId) => {
    event.stopPropagation();
    if (!hotelUid) {
      return;
    }

    setDeletingId(requestId);
    try {
      await deletePurchaseRequest(hotelUid, requestId);
      await loadPurchaseRequests();
    } finally {
      setDeletingId("");
    }
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
            onClick={() => navigate("/purchase-requests/new")}
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
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Required delivery date</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Approver</th>
                    <th className="py-2 pr-4">Aantal items</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseRequests.map((request) => (
                    <tr
                      key={request.id}
                      onClick={() => navigate(`/purchase-requests/${request.id}`)}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="py-3 pr-4 font-semibold text-gray-900">{request.title}</td>
                      <td className="py-3 pr-4 text-gray-700">{request.requiredDeliveryDate}</td>
                      <td className="py-3 pr-4 text-gray-700">{request.status || "Created"}</td>
                      <td className="py-3 pr-4 text-gray-700">{request.approverName || "-"}</td>
                      <td className="py-3 pr-4 text-gray-700">{request.items.length}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/purchase-requests/${request.id}/edit`);
                            }}
                            className="text-gray-500 hover:text-[#b41f1f]"
                            aria-label="Bewerk request"
                            title="Bewerk request"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => handleDelete(event, request.id)}
                            disabled={deletingId === request.id}
                            className="text-gray-500 hover:text-red-600 disabled:opacity-50"
                            aria-label="Verwijder request"
                            title="Verwijder request"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </PageContainer>
    </div>
  );
}
