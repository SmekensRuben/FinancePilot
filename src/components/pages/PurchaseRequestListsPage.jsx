import React, { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "../layout/HeaderBar";
import PageContainer from "../layout/PageContainer";
import { Card } from "../layout/Card";
import { auth, signOut } from "../../firebaseConfig";
import { useHotelContext } from "../../contexts/HotelContext";
import {
  deletePurchaseRequestList,
  getPurchaseRequestLists,
} from "../../services/firebasePurchaseRequestLists";

export default function PurchaseRequestListsPage() {
  const navigate = useNavigate();
  const { hotelUid } = useHotelContext();
  const [lists, setLists] = useState([]);
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

  const loadLists = React.useCallback(async () => {
    if (!hotelUid) {
      setLists([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const data = await getPurchaseRequestLists(hotelUid);
    setLists(data);
    setLoading(false);
  }, [hotelUid]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const handleDelete = async (event, listId) => {
    event.stopPropagation();
    if (!hotelUid) {
      return;
    }

    setDeletingId(listId);
    try {
      await deletePurchaseRequestList(hotelUid, listId);
      await loadLists();
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
            <p className="text-sm text-gray-500 uppercase tracking-wide">Requisition</p>
            <h1 className="text-3xl font-semibold">Purchase Request Lists</h1>
            <p className="text-gray-600 mt-1">Beheer en maak nieuwe Purchase Request Lists aan.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/purchase-request-lists/new")}
            className="bg-[#b41f1f] text-white px-3 py-3 rounded font-semibold shadow hover:bg-[#961919] transition-colors inline-flex items-center justify-center"
            aria-label="Nieuwe Purchase Request List"
            title="Nieuwe Purchase Request List"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <Card>
          {loading ? (
            <p className="text-gray-600">Purchase Request Lists laden...</p>
          ) : lists.length === 0 ? (
            <p className="text-gray-600">Er zijn nog geen Purchase Request Lists.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Aantal items</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lists.map((list) => (
                    <tr
                      key={list.id}
                      onClick={() => navigate(`/purchase-request-lists/${list.id}`)}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="py-3 pr-4 font-semibold text-gray-900">{list.title}</td>
                      <td className="py-3 pr-4 text-gray-700">{list.items.length}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/purchase-request-lists/${list.id}/edit`);
                            }}
                            className="text-gray-500 hover:text-[#b41f1f]"
                            aria-label="Bewerk lijst"
                            title="Bewerk lijst"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => handleDelete(event, list.id)}
                            disabled={deletingId === list.id}
                            className="text-gray-500 hover:text-red-600 disabled:opacity-50"
                            aria-label="Verwijder lijst"
                            title="Verwijder lijst"
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
