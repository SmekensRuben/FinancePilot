import {
  db,
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "../firebaseConfig";

function purchaseRequestsCollection(hotelUid) {
  return collection(db, `hotels/${hotelUid}/purchaseRequests`);
}

export async function getPurchaseRequests(hotelUid) {
  if (!hotelUid) return [];

  const purchaseRequestsQuery = query(
    purchaseRequestsCollection(hotelUid),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(purchaseRequestsQuery);

  return snapshot.docs.map((document) => {
    const data = document.data();
    return {
      id: document.id,
      title: data.title || "",
      requiredDeliveryDate: data.requiredDeliveryDate || "",
      items: Array.isArray(data.items) ? data.items : [],
      createdAt: data.createdAt,
    };
  });
}

export async function createPurchaseRequest(hotelUid, payload) {
  if (!hotelUid) {
    throw new Error("Hotel uid is verplicht");
  }

  const cleanItems = (payload.items || []).map((item) => ({
    articleNumber: item.articleNumber?.trim() || "",
    name: item.name?.trim() || "",
    supplier: item.supplier?.trim() || "",
    unit: item.unit?.trim() || "",
    quantity: Number(item.quantity) || 0,
    netPrice: Number(item.netPrice) || 0,
    vatPercent: Number(item.vatPercent) || 0,
  }));

  return addDoc(purchaseRequestsCollection(hotelUid), {
    title: payload.title?.trim() || "",
    requiredDeliveryDate: payload.requiredDeliveryDate || "",
    items: cleanItems,
    createdAt: serverTimestamp(),
  });
}
