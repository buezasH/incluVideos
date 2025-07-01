/**
 * Storage Status Utility
 * Manages notifications about storage method (R2 vs local)
 */

type StorageMethod = "r2" | "local";

interface StorageStatus {
  method: StorageMethod;
  message: string;
  isOnline: boolean;
}

let currentStorageMethod: StorageMethod = "r2";
let storageStatusCallbacks: ((status: StorageStatus) => void)[] = [];

/**
 * Sets the current storage method
 */
export const setStorageMethod = (method: StorageMethod) => {
  currentStorageMethod = method;
  notifyStatusChange();
};

/**
 * Gets the current storage status
 */
export const getStorageStatus = (): StorageStatus => {
  const isOnline = navigator.onLine;

  if (currentStorageMethod === "r2") {
    return {
      method: "r2",
      message: "Videos stored in cloud storage",
      isOnline,
    };
  } else {
    return {
      method: "local",
      message: "Videos stored locally (cloud storage unavailable)",
      isOnline,
    };
  }
};

/**
 * Subscribe to storage status changes
 */
export const onStorageStatusChange = (
  callback: (status: StorageStatus) => void,
) => {
  storageStatusCallbacks.push(callback);

  // Return unsubscribe function
  return () => {
    storageStatusCallbacks = storageStatusCallbacks.filter(
      (cb) => cb !== callback,
    );
  };
};

/**
 * Notify all subscribers of status change
 */
const notifyStatusChange = () => {
  const status = getStorageStatus();
  storageStatusCallbacks.forEach((callback) => callback(status));
};

// Listen for online/offline events
window.addEventListener("online", notifyStatusChange);
window.addEventListener("offline", notifyStatusChange);
