const STORAGE_KEYS = {
    USERS: 'saa_users',
    RFIS: 'saa_rfis',
    CURRENT_USER: 'saa_current_user',
};

export function getFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

export function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

export function getUsers() {
    return getFromStorage(STORAGE_KEYS.USERS) || [];
}

export function saveUsers(users) {
    saveToStorage(STORAGE_KEYS.USERS, users);
}

export function getCurrentUser() {
    return getFromStorage(STORAGE_KEYS.CURRENT_USER);
}

export function saveCurrentUser(user) {
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
}

export function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

export function getRFIs() {
    return getFromStorage(STORAGE_KEYS.RFIS) || [];
}

export function saveRFIs(rfis) {
    saveToStorage(STORAGE_KEYS.RFIS, rfis);
}

export { STORAGE_KEYS };
