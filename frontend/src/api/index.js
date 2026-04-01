import api from './client'

export const authApi = {
    register: (full_name, email, password, role = 'staff') =>
        api.post('/auth/register', { full_name, email, password, role }),
    login: (email, password) =>
        api.post('/auth/login', { email, password }),
    getCurrentUser: () => api.get('/auth/me'),
}

export const assetApi = {
    scanAsset: (qrCode) => api.post('/assets/scan', { qrCode }),
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

export const activityApi = {
    listLogs: (limit = 50) => api.get('/activity-logs', { params: { limit } }),
}
