import {
  db,
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "../firebaseConfig";

function purchaseRequestsCollection(hotelUid) {
  return collection(db, `hotels/${hotelUid}/purchaseRequests`);
}

function cleanPurchaseItem(item) {
  return {
    articleNumber: item.articleNumber?.trim() || "",
    name: item.name?.trim() || "",
    supplier: item.supplier?.trim() || "",
    unit: item.unit?.trim() || "",
    quantity: Number(item.quantity) || 0,
    netPrice: Number(item.netPrice) || 0,
    vatPercent: Number(item.vatPercent) || 0,
  };
}

function mapPurchaseRequest(documentRef) {
  const data = documentRef.data();
  return {
    id: documentRef.id,
    title: data.title || "",
    requiredDeliveryDate: data.requiredDeliveryDate || "",
    items: Array.isArray(data.items) ? data.items : [],
    status: data.status || "Created",
    statusNote: data.statusNote || "",
    approverUserId: data.approverUserId || "",
    approverName: data.approverName || "",
    createdAt: data.createdAt,
  };
}

export async function getPurchaseRequests(hotelUid) {
  if (!hotelUid) return [];

  const purchaseRequestsQuery = query(
    purchaseRequestsCollection(hotelUid),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(purchaseRequestsQuery);

  return snapshot.docs.map(mapPurchaseRequest);
}

export async function getPurchaseRequestById(hotelUid, requestId) {
  if (!hotelUid || !requestId) {
    return null;
  }

  const requestRef = doc(db, `hotels/${hotelUid}/purchaseRequests`, requestId);
  const requestSnap = await getDoc(requestRef);

  if (!requestSnap.exists()) {
    return null;
  }

  return mapPurchaseRequest(requestSnap);
}

export async function createPurchaseRequest(hotelUid, payload) {
  if (!hotelUid) {
    throw new Error("Hotel uid is verplicht");
  }

  const cleanItems = (payload.items || []).map(cleanPurchaseItem);

  return addDoc(purchaseRequestsCollection(hotelUid), {
    title: payload.title?.trim() || "",
    requiredDeliveryDate: payload.requiredDeliveryDate || "",
    items: cleanItems,
    approverUserId: payload.approverUserId || "",
    approverName: payload.approverName || "",
    status: "Created",
    statusNote: "",
    createdAt: serverTimestamp(),
  });
}

export async function updatePurchaseRequest(hotelUid, requestId, payload) {
  if (!hotelUid || !requestId) {
    throw new Error("Hotel uid en requestId zijn verplicht");
  }

  const requestRef = doc(db, `hotels/${hotelUid}/purchaseRequests`, requestId);

  await updateDoc(requestRef, {
    title: payload.title?.trim() || "",
    requiredDeliveryDate: payload.requiredDeliveryDate || "",
    items: (payload.items || []).map(cleanPurchaseItem),
    approverUserId: payload.approverUserId || "",
    approverName: payload.approverName || "",
  });
}

export async function updatePurchaseRequestStatus(hotelUid, requestId, status, statusNote) {
  if (!hotelUid || !requestId) {
    throw new Error("Hotel uid en requestId zijn verplicht");
  }

  const requestRef = doc(db, `hotels/${hotelUid}/purchaseRequests`, requestId);

  await updateDoc(requestRef, {
    status,
    statusNote: statusNote?.trim() || "",
  });
}

export async function deletePurchaseRequest(hotelUid, requestId) {
  if (!hotelUid || !requestId) {
    throw new Error("Hotel uid en requestId zijn verplicht");
  }

  const requestRef = doc(db, `hotels/${hotelUid}/purchaseRequests`, requestId);
  await deleteDoc(requestRef);
}
