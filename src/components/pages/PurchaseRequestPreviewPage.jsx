import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderBar from "../layout/HeaderBar";
import PageContainer from "../layout/PageContainer";
import { Card } from "../layout/Card";
import { auth, signOut } from "../../firebaseConfig";
import { useHotelContext } from "../../contexts/HotelContext";
import {
  deletePurchaseRequest,
  getPurchaseRequestById,
  updatePurchaseRequestStatus,
} from "../../services/firebasePurchaseRequests";

export default function PurchaseRequestPreviewPage() {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const { hotelUid } = useHotelContext();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [statusModal, setStatusModal] = useState({ open: false, status: "" });
  const [statusNote, setStatusNote] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

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

  const loadRequest = React.useCallback(async () => {
    if (!hotelUid || !requestId) {
      setRequest(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await getPurchaseRequestById(hotelUid, requestId);
    setRequest(data);
    setLoading(false);
  }, [hotelUid, requestId]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const handleDelete = async () => {
    if (!hotelUid || !requestId) {
      return;
    }

    setDeleting(true);
    try {
      await deletePurchaseRequest(hotelUid, requestId);
      navigate("/purchase-requests");
    } finally {
      setDeleting(false);
    }
  };

  const openStatusModal = (status) => {
    setStatusNote("");
    setStatusModal({ open: true, status });
  };

  const handleConfirmStatus = async () => {
    if (!hotelUid || !requestId || !statusModal.status) {
      return;
    }

    setSavingStatus(true);
    try {
      await updatePurchaseRequestStatus(hotelUid, requestId, statusModal.status, statusNote);
      setStatusModal({ open: false, status: "" });
      await loadRequest();
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <HeaderBar today={todayLabel} onLogout={handleLogout} />
      <PageContainer className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">Purchasing</p>
            <h1 className="text-3xl font-semibold">Purchase Request Preview</h1>
            <p className="text-gray-600 mt-1">Bekijk en beheer de geselecteerde Purchase Request.</p>
          </div>
          {request && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/purchase-requests/${request.id}/edit`)}
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
            <p className="text-gray-600">Purchase Request laden...</p>
          ) : !request ? (
            <p className="text-gray-600">Purchase Request niet gevonden.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-xl font-semibold text-gray-900">{request.title}</h2>
                <div className="text-sm text-gray-600">
                  <div>Status: {request.status || "Created"}</div>
                  <div>Required delivery date: {request.requiredDeliveryDate}</div>
                </div>
              </div>
              {request.statusNote ? (
                <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                  <span className="font-semibold">Note:</span> {request.statusNote}
                </div>
              ) : null}
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
                    {request.items.map((item, index) => (
                      <tr key={`${request.id}-item-${index}`} className="border-b border-gray-100">
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

              <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => openStatusModal("Disapproved")}
                  className="px-4 py-2 border border-red-500 text-red-600 rounded font-semibold text-sm"
                >
                  Disapproved
                </button>
                <button
                  type="button"
                  onClick={() => openStatusModal("Approved")}
                  className="px-4 py-2 bg-green-600 text-white rounded font-semibold text-sm"
                >
                  Approved
                </button>
              </div>
            </div>
          )}
        </Card>
      </PageContainer>

      {statusModal.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Confirm status: {statusModal.status}</h2>
            <p className="mt-1 text-sm text-gray-600">Voeg optioneel een note toe voor je bevestigt.</p>

            <label className="mt-4 flex flex-col gap-1 text-sm font-semibold text-gray-700">
              Note
              <textarea
                value={statusNote}
                onChange={(event) => setStatusNote(event.target.value)}
                className="rounded border border-gray-300 px-3 py-2 text-sm min-h-[96px]"
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setStatusModal({ open: false, status: "" });
                  setStatusNote("");
                }}
                className="px-3 py-2 border border-gray-300 rounded font-semibold text-sm"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleConfirmStatus}
                disabled={savingStatus}
                className="bg-[#b41f1f] text-white px-4 py-2 rounded font-semibold text-sm disabled:opacity-60"
              >
                {savingStatus ? "Opslaan..." : "Bevestigen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
