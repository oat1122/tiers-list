import type {
  LocalSoundGuessAssetRef,
  LocalSoundGuessDraft,
} from "@/types/sound-guess-local";

const DB_NAME = "sound-guess-local-creator";
const DB_VERSION = 1;
const DRAFTS_STORE = "drafts";
const ASSETS_STORE = "assets";
const CURRENT_DRAFT_KEY = "current";

interface StoredLocalSoundGuessAssetRef {
  assetId: string;
  fileName: string;
  mimeType: string;
}

interface StoredLocalSoundGuessSoundDraft {
  id: string;
  answer: string;
  audio: StoredLocalSoundGuessAssetRef | null;
  image: StoredLocalSoundGuessAssetRef | null;
  audioStartMs: number;
  audioEndMs: number | null;
  sortOrder: number;
}

interface StoredLocalSoundGuessDraft {
  id: string;
  title: string;
  description: string;
  imageWidth: number;
  imageHeight: number;
  cover: StoredLocalSoundGuessAssetRef | null;
  sounds: StoredLocalSoundGuessSoundDraft[];
  updatedAt: string;
}

interface SoundGuessLocalAssetRecord extends StoredLocalSoundGuessAssetRef {
  blob: Blob;
  updatedAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Ensures local draft storage can run in the current browser.
 *
 * @returns Nothing when IndexedDB is available.
 * @throws Error when the browser environment cannot persist local drafts.
 */
function ensureIndexedDb() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this browser.");
  }
}

/**
 * Converts an IndexedDB request into a Promise for async operations.
 *
 * @param request - IndexedDB request returned by an object store operation.
 * @returns Promise resolved with the request result.
 * @throws Error when the IndexedDB request fails.
 */
function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

/**
 * Waits for an IndexedDB transaction to complete or fail.
 *
 * @param transaction - IndexedDB transaction containing one or more operations.
 * @returns Promise resolved when the transaction commits.
 * @throws Error when the transaction errors or aborts.
 */
function transactionToPromise(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
  });
}

/**
 * Opens the local sound guess database and creates stores on upgrade.
 *
 * @returns Shared database connection promise for draft and asset operations.
 * @throws Error when IndexedDB cannot open the local database.
 */
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

/**
 * Strips object URLs and blob data before storing draft asset metadata.
 *
 * @param asset - Runtime asset reference from the local editor.
 * @returns Persistable asset metadata, or null when no asset exists.
 */
function toStoredAssetRef(
  asset: LocalSoundGuessAssetRef | null,
): StoredLocalSoundGuessAssetRef | null {
  if (!asset) {
    return null;
  }

  return {
    assetId: asset.assetId,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
  };
}

/**
 * Rebuilds a runtime asset reference from stored metadata and a saved blob.
 *
 * @param asset - Stored asset metadata referenced by a draft.
 * @param assetStore - IndexedDB asset store used to read the blob.
 * @returns Runtime asset reference with a fresh object URL, or null when missing.
 */
async function hydrateAssetRef(
  asset: StoredLocalSoundGuessAssetRef | null,
  assetStore: IDBObjectStore,
) {
  if (!asset) {
    return null;
  }

  const record = (await requestToPromise(assetStore.get(asset.assetId))) as
    | SoundGuessLocalAssetRecord
    | undefined;

  if (!record) {
    return null;
  }

  return {
    assetId: record.assetId,
    fileName: record.fileName,
    mimeType: record.mimeType,
    objectUrl: URL.createObjectURL(record.blob),
  } satisfies LocalSoundGuessAssetRef;
}

/**
 * Collects asset ids still referenced by a local draft.
 *
 * @param draft - Local draft whose cover and sound assets should be retained.
 * @returns Set of asset ids that must not be pruned.
 */
function collectReferencedAssetIds(draft: LocalSoundGuessDraft) {
  const ids = new Set<string>();

  if (draft.cover?.assetId) {
    ids.add(draft.cover.assetId);
  }

  draft.sounds.forEach((sound) => {
    if (sound.audio?.assetId) {
      ids.add(sound.audio.assetId);
    }

    if (sound.image?.assetId) {
      ids.add(sound.image.assetId);
    }
  });

  return ids;
}

/**
 * Removes orphaned asset blobs after a draft is saved.
 *
 * @param assetStore - IndexedDB asset store containing saved blobs.
 * @param referencedAssetIds - Asset ids still used by the saved draft.
 * @returns Promise resolved after unused assets are deleted.
 */
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

/**
 * Saves a local audio or image blob and returns a runtime asset reference.
 *
 * @param blob - Audio/image blob or file selected by the local creator.
 * @returns Asset reference containing metadata and a browser object URL.
 */
export async function saveAssetBlob(blob: Blob | File) {
  const database = await openDatabase();
  const assetId = crypto.randomUUID();
  const fileName = blob instanceof File ? blob.name : assetId;
  const mimeType = blob.type || "application/octet-stream";
  const record: SoundGuessLocalAssetRecord = {
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
  } satisfies LocalSoundGuessAssetRef;
}

/**
 * Reads a saved local asset as a File for future editor flows.
 *
 * @param assetId - Asset id previously returned by saveAssetBlob.
 * @returns File when the asset exists, otherwise null.
 */
export async function readAssetBlob(assetId: string) {
  const database = await openDatabase();
  const transaction = database.transaction(ASSETS_STORE, "readonly");
  const assetStore = transaction.objectStore(ASSETS_STORE);
  const record = (await requestToPromise(assetStore.get(assetId))) as
    | SoundGuessLocalAssetRecord
    | undefined;

  await transactionToPromise(transaction);

  if (!record) {
    return null;
  }

  return new File([record.blob], record.fileName, {
    type: record.mimeType || record.blob.type || "application/octet-stream",
  });
}

/**
 * Loads the current local sound guess draft and hydrates asset URLs.
 *
 * @returns Hydrated local draft when saved, otherwise null.
 */
export async function loadCurrentDraft() {
  const database = await openDatabase();
  const transaction = database.transaction(
    [DRAFTS_STORE, ASSETS_STORE],
    "readonly",
  );
  const draftsStore = transaction.objectStore(DRAFTS_STORE);
  const assetStore = transaction.objectStore(ASSETS_STORE);
  const storedDraft = (await requestToPromise(
    draftsStore.get(CURRENT_DRAFT_KEY),
  )) as StoredLocalSoundGuessDraft | undefined;

  if (!storedDraft) {
    await transactionToPromise(transaction);
    return null;
  }

  const draft: LocalSoundGuessDraft = {
    id: storedDraft.id,
    title: storedDraft.title,
    description: storedDraft.description,
    imageWidth: storedDraft.imageWidth,
    imageHeight: storedDraft.imageHeight,
    cover: await hydrateAssetRef(storedDraft.cover, assetStore),
    sounds: await Promise.all(
      storedDraft.sounds.map(async (sound) => ({
        id: sound.id,
        answer: sound.answer,
        audio: await hydrateAssetRef(sound.audio, assetStore),
        image: await hydrateAssetRef(sound.image, assetStore),
        audioStartMs: sound.audioStartMs,
        audioEndMs: sound.audioEndMs,
        sortOrder: sound.sortOrder,
      })),
    ),
    updatedAt: storedDraft.updatedAt,
  };

  await transactionToPromise(transaction);
  return draft;
}

/**
 * Saves the current local draft and prunes assets no longer referenced by it.
 *
 * @param draft - Valid local sound guess draft to persist.
 * @returns Promise resolved when the draft and asset cleanup transaction commits.
 */
export async function saveCurrentDraft(draft: LocalSoundGuessDraft) {
  const database = await openDatabase();
  const transaction = database.transaction(
    [DRAFTS_STORE, ASSETS_STORE],
    "readwrite",
  );
  const draftsStore = transaction.objectStore(DRAFTS_STORE);
  const assetStore = transaction.objectStore(ASSETS_STORE);
  const storedDraft: StoredLocalSoundGuessDraft = {
    id: draft.id,
    title: draft.title,
    description: draft.description,
    imageWidth: draft.imageWidth,
    imageHeight: draft.imageHeight,
    cover: toStoredAssetRef(draft.cover),
    sounds: draft.sounds.map((sound) => ({
      id: sound.id,
      answer: sound.answer,
      audio: toStoredAssetRef(sound.audio),
      image: toStoredAssetRef(sound.image),
      audioStartMs: sound.audioStartMs,
      audioEndMs: sound.audioEndMs,
      sortOrder: sound.sortOrder,
    })),
    updatedAt: draft.updatedAt,
  };

  await requestToPromise(draftsStore.put(storedDraft, CURRENT_DRAFT_KEY));
  await pruneUnusedAssets(assetStore, collectReferencedAssetIds(draft));
  await transactionToPromise(transaction);
}

/**
 * Removes the current local draft and every saved local asset.
 *
 * @returns Promise resolved when all local sound guess data is cleared.
 */
export async function clearCurrentDraft() {
  const database = await openDatabase();
  const transaction = database.transaction(
    [DRAFTS_STORE, ASSETS_STORE],
    "readwrite",
  );

  await requestToPromise(
    transaction.objectStore(DRAFTS_STORE).delete(CURRENT_DRAFT_KEY),
  );
  await requestToPromise(transaction.objectStore(ASSETS_STORE).clear());
  await transactionToPromise(transaction);
}
