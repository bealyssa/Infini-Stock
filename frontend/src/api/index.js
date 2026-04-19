import api from './client'

export const authApi = {
    register: (full_name, email, password, role = 'staff') =>
        api.post('/auth/register', { full_name, email, password, role }),
    login: (email, password) =>
        api.post('/auth/login', { email, password }),
    getCurrentUser: () => api.get('/auth/me'),
    updateMe: ({ full_name, email } = {}) => api.patch('/auth/me', { full_name, email }),
    changePassword: ({ current_password, new_password } = {}) =>
        api.patch('/auth/password', { current_password, new_password }),
}

export const assetApi = {
    listAssets: () => api.get('/assets'),
    getAssetByQr: (qrCode) => api.get(`/assets/qr/${encodeURIComponent(qrCode)}`),
    createAsset: ({ type, qrCode, location, status, parentQrCode, imageData, description } = {}) =>
        api.post('/assets', { type, qrCode, location, status, parentQrCode, imageData, description }),
    scanAsset: (qrCode) => api.post('/assets/scan', { qrCode }),
    upsertAssetMeta: ({ qrCode, type, imageData, description } = {}) =>
        api.patch('/assets/meta', { qrCode, type, imageData, description }),
    updateLocation: (qrCode, location) =>
        api.patch('/assets/location', { qrCode, location }),
    updateStatus: (qrCode, status) =>
        api.patch('/assets/status', { qrCode, status }),
    swapMonitor: (systemUnitQr, oldMonitorQr, newMonitorQr) =>
        api.post('/assets/swap-monitor', {
            systemUnitQr,
            oldMonitorQr,
            newMonitorQr,
        }),
    iotScanUpdate: (qrCode, location, status) =>
        api.post('/assets/iot/scan-update', { qrCode, location, status }),
}

export const unitApi = {
    listUnits: () => api.get('/units'),
    createUnit: ({ deviceName, qrCode, status, location, condition, modelType, serialNumber, description, notes, imageData } = {}) =>
        api.post('/units', { deviceName, qrCode, status, location, condition, modelType, serialNumber, description, notes, imageData }),
    updateUnit: (id, payload = {}) => api.patch(`/units/${id}`, payload),
    deleteUnit: (id) => api.delete(`/units/${id}`),
}

export const monitorApi = {
    listMonitors: () => api.get('/monitors'),
    createMonitor: ({ deviceName, qrCode, status, modelType, serialNumber, condition, description, notes, linkedUnitId, imageData } = {}) =>
        api.post('/monitors', { deviceName, qrCode, status, modelType, serialNumber, condition, description, notes, linkedUnitId, imageData }),
    updateMonitor: (id, payload = {}) => api.patch(`/monitors/${id}`, payload),
    deleteMonitor: (id) => api.delete(`/monitors/${id}`),
}

export const activityApi = {
    listLogs: (limit = 50) => api.get('/activity-logs', { params: { limit } }),
}

export const adminApi = {
    listUsers: () => api.get('/admin/users'),
    createUser: (payload) => api.post('/admin/users', payload),
    updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
}
