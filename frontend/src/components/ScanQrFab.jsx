import { useEffect, useMemo, useRef, useState } from 'react'
import { BrowserQRCodeReader } from '@zxing/browser'
import { Camera, QrCode, Upload, XCircle, Printer } from 'lucide-react'
import { assetApi, monitorApi, unitApi } from '../api'
import { Button } from './ui/Button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    useDialog,
} from './ui/Dialog'
import { PrintQRModal } from './ActionModals'
import { AssetDetailsModal } from './AssetDetailsModal'


export default function ScanQrFab() {
    const dialogState = useDialog()
    const detailsModalState = useDialog()
    const [mode, setMode] = useState('camera') // 'camera' | 'upload'

    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(null)
    const [decodedQr, setDecodedQr] = useState(null)
    const [asset, setAsset] = useState(null)
    const [printQRModalOpen, setPrintQRModalOpen] = useState(false)
    const [cameraPermission, setCameraPermission] = useState('prompt') // 'prompt' | 'granted' | 'denied'
    const [requestingPermission, setRequestingPermission] = useState(false)

    const videoRef = useRef(null)
    const controlsRef = useRef(null)
    const handledRef = useRef(false)

    const codeReader = useMemo(() => new BrowserQRCodeReader(), [])

    // Request camera permission explicitly
    const requestCameraPermission = async () => {
        setRequestingPermission(true)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })
            // Stop the stream immediately - we just needed to check permission
            stream.getTracks().forEach(track => track.stop())
            setCameraPermission('granted')
            setError(null)
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                setCameraPermission('denied')
                setError('Camera permission denied. Please allow camera access in your browser settings.')
            } else if (err.name === 'NotFoundError') {
                setError('No camera device found on this device.')
            } else {
                setError(err.message || 'Unable to access camera')
            }
            setCameraPermission('denied')
        } finally {
            setRequestingPermission(false)
        }
    }

    const resetState = () => {
        setMode('camera')
        setBusy(false)
        setError(null)
        setDecodedQr(null)
        setAsset(null)
    }

    const stopCamera = () => {
        if (controlsRef.current) {
            try {
                controlsRef.current.stop()
            } catch {
                // ignore
            }
            controlsRef.current = null
        }
    }

    const scanQr = async (qrText) => {
        const code = (qrText || '').trim()
        if (!code) return

        setDecodedQr(code)
        setError(null)
        setBusy(true)

        try {
            // First, scan the asset to get basic info
            const { data: assetData } = await assetApi.scanAsset(code)

            let fullAsset = { ...assetData }

            // Fetch full details based on type
            try {
                if (assetData.type === 'monitor') {
                    // Fetch all monitors and find the matching one
                    const { data: monitors } = await monitorApi.listMonitors()
                    const monitor = monitors.find(m => m.qrCode === code)
                    if (monitor) {
                        fullAsset = { ...fullAsset, ...monitor }
                    }
                } else if (assetData.type === 'unit') {
                    // Fetch all units and find the matching one
                    const { data: units } = await unitApi.listUnits()
                    const unit = units.find(u => u.qrCode === code)
                    if (unit) {
                        fullAsset = { ...fullAsset, ...unit }
                    }
                }
            } catch (err) {
                // If fetching full details fails, continue with basic data
                console.warn('Could not fetch full asset details:', err)
            }

            setAsset(fullAsset)
            setBusy(false)
            // Open details modal after setting asset
            setTimeout(() => detailsModalState.onOpenChange(true), 100)
        } catch (err) {
            setAsset(null)
            setBusy(false)
            setError(err?.response?.data?.message || err?.message || 'Failed to scan QR code')
        }
    }

    useEffect(() => {
        // When modal opens and we're in camera mode, auto-request permission
        if (dialogState.open && mode === 'camera' && cameraPermission === 'prompt') {
            requestCameraPermission()
        }
    }, [dialogState.open, mode, cameraPermission])

    useEffect(() => {
        if (!dialogState.open) {
            handledRef.current = false
            stopCamera()
            resetState()
            return
        }

        if (mode !== 'camera') {
            handledRef.current = false
            stopCamera()
            return
        }

        // If camera permission not granted, don't try to access camera
        if (cameraPermission !== 'granted') {
            return
        }

        if (!videoRef.current) return

        handledRef.current = false
        setError(null)

        let cancelled = false

            ; (async () => {
                try {
                    const controls = await codeReader.decodeFromVideoDevice(
                        undefined,
                        videoRef.current,
                        (result, resultError, controlsInner) => {
                            if (cancelled) return
                            if (result && !handledRef.current) {
                                handledRef.current = true
                                try {
                                    controlsInner.stop()
                                } catch {
                                    // ignore
                                }
                                controlsRef.current = null
                                scanQr(result.getText())
                            }
                            if (resultError) {
                                // zxing reports lots of "no code found" as errors; ignore
                            }
                        },
                    )

                    if (!cancelled) {
                        controlsRef.current = controls
                    } else {
                        try {
                            controls.stop()
                        } catch {
                            // ignore
                        }
                    }
                } catch (e) {
                    if (!cancelled) {
                        setError(e?.message || 'Camera unavailable')
                    }
                }
            })()

        return () => {
            cancelled = true
            handledRef.current = false
            stopCamera()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dialogState.open, mode, codeReader, cameraPermission])

    const handleUpload = async (file) => {
        if (!file) return
        setError(null)
        setAsset(null)
        setDecodedQr(null)
        setBusy(true)

        let url = null
        try {
            url = URL.createObjectURL(file)
            const result = await codeReader.decodeFromImageUrl(url)
            await scanQr(result.getText())
        } catch (e) {
            setError(e?.message || 'Could not read QR code from image')
        } finally {
            setBusy(false)
            if (url) URL.revokeObjectURL(url)
        }
    }

    return (
        <>
            <Button
                type="button"
                onClick={() => dialogState.onOpenChange(true)}
                size="icon"
                className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
                aria-label="Scan QR code"
            >
                <QrCode size={22} />
            </Button>

            <Dialog
                open={dialogState.open}
                onOpenChange={(open) => {
                    dialogState.onOpenChange(open)
                    if (!open) {
                        stopCamera()
                        resetState()
                    }
                }}
            >
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Scan QR Code</DialogTitle>
                        <DialogDescription>
                            Upload a QR image or scan using your camera
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 flex items-center gap-2">
                        <Button
                            type="button"
                            variant={mode === 'camera' ? 'default' : 'secondary'}
                            className="gap-2"
                            onClick={() => {
                                setMode('camera')
                                setError(null)
                                setAsset(null)
                                setDecodedQr(null)
                                // Auto-request camera permission when switching to camera mode
                                if (cameraPermission === 'prompt') {
                                    requestCameraPermission()
                                }
                            }}
                        >
                            <Camera size={18} />
                            Scan
                        </Button>
                        <Button
                            type="button"
                            variant={mode === 'upload' ? 'default' : 'secondary'}
                            className="gap-2"
                            onClick={() => {
                                setMode('upload')
                                setError(null)
                                setAsset(null)
                                setDecodedQr(null)
                            }}
                        >
                            <Upload size={18} />
                            Upload
                        </Button>
                    </div>

                    <div className="mt-4">
                        {mode === 'camera' ? (
                            <div className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-200">Camera</p>
                                    {error ? (
                                        <div className="inline-flex items-center gap-2 text-sm text-red-300">
                                            <XCircle size={16} />
                                            <span>Camera error</span>
                                        </div>
                                    ) : cameraPermission === 'granted' ? (
                                        <p className="text-xs text-gray-500">Point at a QR code</p>
                                    ) : (
                                        <p className="text-xs text-amber-500">Permission needed</p>
                                    )}
                                </div>

                                {cameraPermission !== 'granted' ? (
                                    <div className="rounded-md border border-[#3d2e5c] bg-black p-6 flex flex-col items-center justify-center h-56">
                                        <Camera size={32} className="text-gray-500 mb-3" />
                                        <p className="text-gray-400 text-sm text-center mb-4">
                                            {cameraPermission === 'denied'
                                                ? 'Camera permission was denied'
                                                : 'Camera access is required to scan QR codes'}
                                        </p>
                                        <Button
                                            type="button"
                                            onClick={requestCameraPermission}
                                            disabled={requestingPermission}
                                            className="gap-2"
                                        >
                                            <Camera size={16} />
                                            {requestingPermission ? 'Requesting...' : 'Request Camera Permission'}
                                        </Button>
                                        {cameraPermission === 'denied' && (
                                            <p className="text-xs text-gray-500 mt-3 text-center">
                                                If permission was denied, please check your browser settings and allow camera access for this site.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-md border border-[#3d2e5c] bg-black">
                                        <video
                                            ref={videoRef}
                                            className="h-56 w-full object-cover"
                                            muted
                                            playsInline
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] p-3">
                                <p className="mb-2 text-sm font-semibold text-gray-200">Upload QR Image</p>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleUpload(e.target.files?.[0])}
                                        className="hidden"
                                        id="qrUploadInput"
                                    />
                                    <label
                                        htmlFor="qrUploadInput"
                                        className="inline-flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-[#3d2e5c] bg-[#0f0a1a] px-4 py-3 text-sm text-gray-400 transition-colors hover:border-lavender-500 hover:bg-lavender-500/5 hover:text-gray-300"
                                    >
                                        Click to upload QR image
                                    </label>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">Upload a photo/screenshot containing a QR code.</p>
                            </div>
                        )}
                    </div>

                    {error ? (
                        <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {error}
                        </div>
                    ) : null}

                    {asset ? (
                        <div className="mt-4 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                            ✓ Asset detected: <span className="font-semibold">{asset.deviceName || asset.qrCode}</span>
                            <p className="text-xs text-green-300/70 mt-1">Tap "View Details" to see full information</p>
                        </div>
                    ) : null}

                    <DialogFooter className="pt-4 flex gap-2">
                        {asset ? (
                            <>
                                <Button
                                    type="button"
                                    variant="default"
                                    onClick={() => detailsModalState.onOpenChange(true)}
                                    className="gap-2"
                                >
                                    View Details
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPrintQRModalOpen(true)}
                                    className="gap-2"
                                >
                                    <Printer size={16} />
                                    Print QR
                                </Button>
                            </>
                        ) : null}
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => dialogState.onOpenChange(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Print QR Modal */}
            <PrintQRModal
                isOpen={printQRModalOpen}
                onClose={() => setPrintQRModalOpen(false)}
                item={asset}
            />

            {/* Asset Details Modal */}
            <AssetDetailsModal
                isOpen={detailsModalState.open}
                onClose={() => detailsModalState.onOpenChange(false)}
                asset={asset}
                loading={busy}
            />
        </>
    )
}
