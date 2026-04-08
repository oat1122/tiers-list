import type {
  LocalPictureRevealAssetRef,
  LocalPictureRevealDraft,
} from "@/types/picture-reveal-local";

const DB_NAME = "picture-reveal-local-creator";
const DB_VERSION = 1;
const DRAFTS_STORE = "drafts";
const ASSETS_STORE = "assets";
const CURRENT_DRAFT_KEY = "current";

interface StoredLocalPictureRevealAssetRef {
  assetId: string;
  fileName: string;
  mimeType: string;
}

interface StoredLocalPictureRevealImageDraft {
  id: string;
  answer: string;
  rows: number;
  cols: number;
  specialTileCount: number;
  specialPattern: LocalPictureRevealDraft["images"][number]["specialPattern"];
  sortOrder: number;
  image: StoredLocalPictureRevealAssetRef | null;
  originalImage: StoredLocalPictureRevealAssetRef | null;
}

interface StoredLocalPictureRevealDraft {
  id: string;
  title: string;
  description: string;
  mode: LocalPictureRevealDraft["mode"];
  startScore: number;
  openTilePenalty: number;
  specialTilePenalty: number;
  imageWidth: number;
  imageHeight: number;
  cover: StoredLocalPictureRevealAssetRef | null;
  images: StoredLocalPictureRevealImageDraft[];
  updatedAt: string;
}

interface PictureRevealLocalAssetRecord extends StoredLocalPictureRevealAssetRef {
  blob: Blob;
  updatedAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function ensureIndexedDb() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this browser.");
  }
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionToPromise(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
  });
}

async function openDatabase() {
  ensureIndexedDb();

  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(DRAFTS_STORE)) {
          database.createObjectStore(DRAFTS_STORE);
        }

        if (!database.objectStoreNames.contains(ASSETS_STORE)) {
          database.createObjectStore(ASSETS_STORE, { keyPath: "assetId" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error("Could not open IndexedDB."));
    });
  }

  return dbPromise;
}

function toStoredAssetRef(
  asset: LocalPictureRevealAssetRef | null,
): StoredLocalPictureRevealAssetRef | null {
  if (!asset) {
    return null;
  }

  return {
    assetId: asset.assetId,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
  };
}

async function hydrateAssetRef(
  asset: StoredLocalPictureRevealAssetRef | null,
  assetStore: IDBObjectStore,
) {
  if (!asset) {
    return null;
  }

  const record = (await requestToPromise(
    assetStore.get(asset.assetId),
  )) as PictureRevealLocalAssetRecord | undefined;

  if (!record) {
    return null;
  }

  return {
    assetId: record.assetId,
    fileName: record.fileName,
    mimeType: record.mimeType,
    objectUrl: URL.createObjectURL(record.blob),
  } satisfies LocalPictureRevealAssetRef;
}

function collectReferencedAssetIds(draft: LocalPictureRevealDraft) {
  const ids = new Set<string>();

  if (draft.cover?.assetId) {
    ids.add(draft.cover.assetId);
  }

  draft.images.forEach((image) => {
    if (image.image?.assetId) {
      ids.add(image.image.assetId);
    }

    if (image.originalImage?.assetId) {
      ids.add(image.originalImage.assetId);
    }
  });

  return ids;
}

async function pruneUnusedAssets(
  assetStore: IDBObjectStore,
  referencedAssetIds: Set<string>,
) {
  const allKeys = (await requestToPromise(assetStore.getAllKeys())) as string[];

  await Promise.all(
    allKeys
      .filter((key) => !referencedAssetIds.has(key))
      .map((key) => requestToPromise(assetStore.delete(key))),
  );
}

export async function saveAssetBlob(blob: Blob | File) {
  const database = await openDatabase();
  const assetId = crypto.randomUUID();
  const fileName = blob instanceof File ? blob.name : `${assetId}.webp`;
  const mimeType = blob.type || "image/webp";
  const record: PictureRevealLocalAssetRecord = {
    assetId,
    fileName,
    mimeType,
    blob,
    updatedAt: new Date().toISOString(),
  };
  const transaction = database.transaction(ASSETS_STORE, "readwrite");
  const assetStore = transaction.objectStore(ASSETS_STORE);

  await requestToPromise(assetStore.put(record));
  await transactionToPromise(transaction);

  return {
    assetId,
    fileName,
    mimeType,
    objectUrl: URL.createObjectURL(blob),
  } satisfies LocalPictureRevealAssetRef;
}

export async function readAssetBlob(assetId: string) {
  const database = await openDatabase();
  const transaction = database.transaction(ASSETS_STORE, "readonly");
  const assetStore = transaction.objectStore(ASSETS_STORE);
  const record = (await requestToPromise(
    assetStore.get(assetId),
  )) as PictureRevealLocalAssetRecord | undefined;

  await transactionToPromise(transaction);

  if (!record) {
    return null;
  }

  return new File([record.blob], record.fileName, {
    type: record.mimeType || record.blob.type || "image/webp",
  });
}

export async function loadCurrentDraft() {
  const database = await openDatabase();
  const transaction = database.transaction([DRAFTS_STORE, ASSETS_STORE], "readonly");
  const draftsStore = transaction.objectStore(DRAFTS_STORE);
  const assetStore = transaction.objectStore(ASSETS_STORE);
  const storedDraft = (await requestToPromise(
    draftsStore.get(CURRENT_DRAFT_KEY),
  )) as StoredLocalPictureRevealDraft | undefined;

  if (!storedDraft) {
    await transactionToPromise(transaction);
    return null;
  }

  const draft: LocalPictureRevealDraft = {
    id: storedDraft.id,
    title: storedDraft.title,
    description: storedDraft.description,
    mode: storedDraft.mode,
    startScore: storedDraft.startScore,
    openTilePenalty: storedDraft.openTilePenalty,
    specialTilePenalty: storedDraft.specialTilePenalty,
    imageWidth: storedDraft.imageWidth,
    imageHeight: storedDraft.imageHeight,
    cover: await hydrateAssetRef(storedDraft.cover, assetStore),
    images: await Promise.all(
      storedDraft.images.map(async (image) => ({
        id: image.id,
        answer: image.answer,
        rows: image.rows,
        cols: image.cols,
        specialTileCount: image.specialTileCount,
        specialPattern: image.specialPattern,
        sortOrder: image.sortOrder,
        image: await hydrateAssetRef(image.image, assetStore),
        originalImage: await hydrateAssetRef(image.originalImage, assetStore),
      })),
    ),
    updatedAt: storedDraft.updatedAt,
  };

  await transactionToPromise(transaction);
  return draft;
}

export async function saveCurrentDraft(draft: LocalPictureRevealDraft) {
  const database = await openDatabase();
  const transaction = database.transaction([DRAFTS_STORE, ASSETS_STORE], "readwrite");
  const draftsStore = transaction.objectStore(DRAFTS_STORE);
  const assetStore = transaction.objectStore(ASSETS_STORE);
  const storedDraft: StoredLocalPictureRevealDraft = {
    id: draft.id,
    title: draft.title,
    description: draft.description,
    mode: draft.mode,
    startScore: draft.startScore,
    openTilePenalty: draft.openTilePenalty,
    specialTilePenalty: draft.specialTilePenalty,
    imageWidth: draft.imageWidth,
    imageHeight: draft.imageHeight,
    cover: toStoredAssetRef(draft.cover),
    images: draft.images.map((image) => ({
      id: image.id,
      answer: image.answer,
      rows: image.rows,
      cols: image.cols,
      specialTileCount: image.specialTileCount,
      specialPattern: image.specialPattern,
      sortOrder: image.sortOrder,
      image: toStoredAssetRef(image.image),
      originalImage: toStoredAssetRef(image.originalImage),
    })),
    updatedAt: draft.updatedAt,
  };

  await requestToPromise(draftsStore.put(storedDraft, CURRENT_DRAFT_KEY));
  await pruneUnusedAssets(assetStore, collectReferencedAssetIds(draft));
  await transactionToPromise(transaction);
}

export async function clearCurrentDraft() {
  const database = await openDatabase();
  const transaction = database.transaction([DRAFTS_STORE, ASSETS_STORE], "readwrite");

  await requestToPromise(transaction.objectStore(DRAFTS_STORE).delete(CURRENT_DRAFT_KEY));
  await requestToPromise(transaction.objectStore(ASSETS_STORE).clear());
  await transactionToPromise(transaction);
}
