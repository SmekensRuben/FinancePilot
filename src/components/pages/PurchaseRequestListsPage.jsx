import React, { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "../layout/HeaderBar";
import PageContainer from "../layout/PageContainer";
import { Card } from "../layout/Card";
import { auth, signOut } from "../../firebaseConfig";
import { useHotelContext } from "../../contexts/HotelContext";
import { getPurchaseRequestLists } from "../../services/firebasePurchaseRequestLists";

export default function PurchaseRequestListsPage() {
  const navigate = useNavigate();
  const { hotelUid } = useHotelContext();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

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
    async function loadLists() {
      if (!hotelUid) {
        setLists([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await getPurchaseRequestLists(hotelUid);
      setLists(data);
      setLoading(false);
    }

    loadLists();
  }, [hotelUid]);

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
            <div className="space-y-4">
              {lists.map((list) => (
                <div key={list.id} className="rounded border border-gray-200 p-4 bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">{list.title}</h2>
                    <span className="text-sm text-gray-600">{list.items.length} items</span>
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
                        {list.items.map((item, index) => (
                          <tr key={`${list.id}-item-${index}`} className="border-t border-gray-100">
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
    </div>
  );
}
