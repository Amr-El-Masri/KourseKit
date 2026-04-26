const DB_NAME = "koursekit-e2ee";
const DB_VERSION = 1;
const STORE = "keys";

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function bytesToB64(buf) {
  const bytes = new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}
function idbGet(db, key) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}
function idbPut(db, key, value) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readwrite").objectStore(STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function importPublicKey(b64) {
  return crypto.subtle.importKey(
    "spki", b64ToBytes(b64).buffer,
    { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]
  );
}
async function importPrivateKey(b64) {
  return crypto.subtle.importKey(
    "pkcs8", b64ToBytes(b64).buffer,
    { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]
  );
}

const autoPassword = (userId) => `kk-auto-${userId}`;

export async function initE2EE(userId, apiFetch) {
  const db = await openDB();
  const PRIV_KEY = `privKeyB64_${userId}`;
  const PUB_KEY  = `pubKeyB64_${userId}`;

  let privateB64 = await idbGet(db, PRIV_KEY);
  let publicB64  = await idbGet(db, PUB_KEY);

  if (!privateB64 || !publicB64) {
    try {
      const backup = await apiFetch("/api/keys/private");
      if (backup?.hasKey) {
        const restored = await restorePrivateKey(backup.encryptedPrivateKey, autoPassword(userId));
        const keyData  = await apiFetch("/api/keys/me");
        if (keyData?.publicKey) {
          await idbPut(db, PRIV_KEY, restored);
          await idbPut(db, PUB_KEY,  keyData.publicKey);
          await apiFetch("/api/keys", { method: "POST", body: JSON.stringify({ publicKey: keyData.publicKey }) });
          const privateKey = await importPrivateKey(restored);
          const publicKey  = await importPublicKey(keyData.publicKey);
          return { privateKey, publicKey };
        }
      }
    } catch { /* non-critical */ }

    const kp = await crypto.subtle.generateKey(
      { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
      true, ["encrypt", "decrypt"]
    );
    privateB64 = bytesToB64(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
    publicB64  = bytesToB64(await crypto.subtle.exportKey("spki",  kp.publicKey));
    await idbPut(db, PRIV_KEY, privateB64);
    await idbPut(db, PUB_KEY,  publicB64);
    await apiFetch("/api/keys", { method: "POST", body: JSON.stringify({ publicKey: publicB64 }) });
    try {
      const encryptedB64 = await backupPrivateKey(privateB64, autoPassword(userId));
      await apiFetch("/api/keys/private", { method: "POST", body: JSON.stringify({ encryptedPrivateKey: encryptedB64 }) });
    } catch { /* non-critical */ }
    const privateKey = await importPrivateKey(privateB64);
    const publicKey  = await importPublicKey(publicB64);
    return { privateKey, publicKey, isNew: true };
  } else {
    try {
      await apiFetch("/api/keys", { method: "POST", body: JSON.stringify({ publicKey: publicB64 }) });
    } catch { /* non-critical */ }
    try {
      const backup = await apiFetch("/api/keys/private");
      if (!backup?.hasKey) {
        const encryptedB64 = await backupPrivateKey(privateB64, autoPassword(userId));
        await apiFetch("/api/keys/private", { method: "POST", body: JSON.stringify({ encryptedPrivateKey: encryptedB64 }) });
      }
    } catch { /* non-critical */ }
  }

  const privateKey = await importPrivateKey(privateB64);
  const publicKey  = await importPublicKey(publicB64);
  return { privateKey, publicKey };
}

// restore keypair from server backup using password, store in IndexedDB
export async function restoreFromBackup(encryptedPrivateKeyB64, password, userId, apiFetch) {
  const privateB64 = await restorePrivateKey(encryptedPrivateKeyB64, password);
  // fetch public key from server
  const keyData = await apiFetch("/api/keys/me");
  if (!keyData?.publicKey) throw new Error("Could not fetch public key from server");
  const publicB64 = keyData.publicKey;
  const db = await openDB();
  await idbPut(db, `privKeyB64_${userId}`, privateB64);
  await idbPut(db, `pubKeyB64_${userId}`,  publicB64);
  // re-upload public key so it's definitely current
  await apiFetch("/api/keys", { method: "POST", body: JSON.stringify({ publicKey: publicB64 }) });
  console.log("[E2EE] restored keypair from backup");
  const privateKey = await importPrivateKey(privateB64);
  const publicKey  = await importPublicKey(publicB64);
  return { privateKey, publicKey };
}

// encrypt and upload private key backup using a password
export async function backupKey(userId, password, apiFetch) {
  const db = await openDB();
  const privateB64 = await idbGet(db, `privKeyB64_${userId}`);
  if (!privateB64) throw new Error("No private key found in IndexedDB");
  const encryptedB64 = await backupPrivateKey(privateB64, password);
  await apiFetch("/api/keys/private", { method: "POST", body: JSON.stringify({ encryptedPrivateKey: encryptedB64 }) });
  console.log("[E2EE] private key backup uploaded");
}

export async function fetchMemberPublicKeys(userIds, apiFetch) {
  if (!userIds.length) return {};
  try {
    const keys = await apiFetch("/api/keys/batch", {
      method: "POST", body: JSON.stringify({ userIds }),
    });
    const result = {};
    for (const { userId, publicKey } of keys) {
      result[String(userId)] = await importPublicKey(publicKey);
    }
    return result;
  } catch { return {}; }
}

export async function encryptMessage(plaintext, memberPublicKeys) {
  const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const rawAes = await crypto.subtle.exportKey("raw", aesKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, aesKey, new TextEncoder().encode(plaintext)
  );

  const encryptedKeys = {};
  for (const [uid, pubKey] of Object.entries(memberPublicKeys)) {
    const wrapped = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKey, rawAes);
    encryptedKeys[uid] = bytesToB64(wrapped);
  }

  return {
    content: bytesToB64(ciphertext),
    iv: bytesToB64(iv),
    encryptedKeys: JSON.stringify(encryptedKeys),
    rawAes,
  };
}

export async function decryptMessage(msg, myUserId, privateKey) {
  if (!msg.iv || !msg.encryptedKeys || !privateKey) return msg;
  if (msg.isDeleted) return msg;
  try {
    const encryptedKeys = JSON.parse(msg.encryptedKeys || "{}");
    const myEncKey = encryptedKeys[String(myUserId)];
    console.log("[E2EE] decrypting msg", msg.id, "myUserId:", myUserId, "keys in msg:", Object.keys(encryptedKeys));
    if (!myEncKey) return { ...msg, content: null, _notMember: true };

    const rawAes = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" }, privateKey, b64ToBytes(myEncKey).buffer
    );
    const aesKey = await crypto.subtle.importKey("raw", rawAes, { name: "AES-GCM" }, false, ["decrypt"]);
    let decryptedContent = "";
    if (msg.content) {
      const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: b64ToBytes(msg.iv) }, aesKey, b64ToBytes(msg.content).buffer
      );
      decryptedContent = new TextDecoder().decode(plain);
    }
    return { ...msg, content: decryptedContent, rawAes };
  } catch (err) {
    console.error("[E2EE] decrypt failed:", err.message, "userId:", myUserId, "hasKey:", !!privateKey);
    return { ...msg, _decryptFailed: true };
  }
}

export async function encryptFile(fileArrayBuffer, rawAes) {
  const aesKey = await crypto.subtle.importKey("raw", rawAes, { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, fileArrayBuffer);
  const result = new Uint8Array(12 + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), 12);
  return result.buffer;
}

export async function decryptFile(encryptedArrayBuffer, rawAes) {
  const data = new Uint8Array(encryptedArrayBuffer);
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const aesKey = await crypto.subtle.importKey("raw", rawAes, { name: "AES-GCM" }, false, ["decrypt"]);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ciphertext.buffer);
}

export async function backupPrivateKey(privateB64, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const passwordKey = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
  );
  const wrappingKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 200000, hash: "SHA-256" },
    passwordKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, wrappingKey, b64ToBytes(privateB64).buffer
  );
  const combined = new Uint8Array(16 + 12 + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, 16);
  combined.set(new Uint8Array(encrypted), 28);
  return bytesToB64(combined.buffer);
}

export async function restorePrivateKey(encryptedB64, password) {
  const data = b64ToBytes(encryptedB64);
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const ciphertext = data.slice(28);
  const passwordKey = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
  );
  const wrappingKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 200000, hash: "SHA-256" },
    passwordKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv }, wrappingKey, ciphertext.buffer
  );
  return bytesToB64(decrypted);
}
