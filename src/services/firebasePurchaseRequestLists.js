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
} from "../firebaseConfig";

function purchaseRequestListsCollection(hotelUid) {
  return collection(db, `hotels/${hotelUid}/purchaseRequestLists`);
}

export async function getPurchaseRequestLists(hotelUid) {
  if (!hotelUid) return [];

  const listsQuery = query(
    purchaseRequestListsCollection(hotelUid),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(listsQuery);

  return snapshot.docs.map((documentRef) => {
    const data = documentRef.data();
    return {
      id: documentRef.id,
      title: data.title || "",
      items: Array.isArray(data.items) ? data.items : [],
      createdAt: data.createdAt,
    };
  });
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

export async function createPurchaseRequestList(hotelUid, payload) {
  if (!hotelUid) {
    throw new Error("Hotel uid is verplicht");
  }

  const cleanItems = (payload.items || []).map(cleanPurchaseItem);

  return addDoc(purchaseRequestListsCollection(hotelUid), {
    title: payload.title?.trim() || "",
    items: cleanItems,
    createdAt: serverTimestamp(),
  });
}

export async function addItemToPurchaseRequestList(hotelUid, listId, item) {
  if (!hotelUid || !listId) {
    throw new Error("Hotel uid en listId zijn verplicht");
  }

  const listRef = doc(db, `hotels/${hotelUid}/purchaseRequestLists`, listId);
  const listSnap = await getDoc(listRef);

  if (!listSnap.exists()) {
    throw new Error("Purchase Request List bestaat niet");
  }

  const data = listSnap.data();
  const existingItems = Array.isArray(data.items) ? data.items : [];

  await updateDoc(listRef, {
    items: [...existingItems, cleanPurchaseItem(item)],
  });
}
