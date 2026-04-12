import { useEffect, useMemo, useRef, useState } from 'react'
import { BrowserQRCodeReader } from '@zxing/browser'
import { Camera, QrCode, Upload, XCircle, Printer } from 'lucide-react'
import { assetApi } from '../api'
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


export default function ScanQrFab() {
    const dialogState = useDialog()
    const [mode, setMode] = useState('camera') // 'camera' | 'upload'

    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(null)
    const [decodedQr, setDecodedQr] = useState(null)
    const [asset, setAsset] = useState(null)
    const [printQRModalOpen, setPrintQRModalOpen] = useState(false)

    const videoRef = useRef(null)
    const controlsRef = useRef(null)
    const handledRef = useRef(false)

    const codeReader = useMemo(() => new BrowserQRCodeReader(), [])

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
            const { data } = await assetApi.scanAsset(code)
            setAsset(data)
        } catch (err) {
            setAsset(null)
            setError(err?.response?.data?.message || err?.message || 'Failed to scan QR code')
        } finally {
            setBusy(false)
        }
    }

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
    }, [dialogState.open, mode, codeReader])

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
                                    ) : (
                                        <p className="text-xs text-gray-500">Point at a QR code</p>
                                    )}
                                </div>
                                <div className="overflow-hidden rounded-md border border-[#3d2e5c] bg-black">
                                    <video
                                        ref={videoRef}
                                        className="h-56 w-full object-cover"
                                        muted
                                        playsInline
                                    />
                                </div>
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

                    <div className="mt-4 rounded-lg border border-[#3d2e5c] bg-[#0f0a1a] p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-200">Result</p>
                                <p className="text-xs text-gray-500">{decodedQr || '—'}</p>
                            </div>
                            {busy ? (
                                <p className="text-xs text-gray-500">Loading…</p>
                            ) : null}
                        </div>

                        {asset ? (
                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
                                <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] p-2">
                                    {asset.imageData ? (
                                        <img
                                            src={asset.imageData}
                                            alt={asset.qrCode}
                                            className="h-36 w-full rounded-md object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-36 items-center justify-center rounded-md border border-dashed border-[#3d2e5c] bg-[#0f0a1a] text-xs text-gray-500">
                                            No image
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2">
                                        <div className="text-[11px] uppercase tracking-wider text-gray-500">Type</div>
                                        <div className="text-sm text-gray-200">{asset.type || 'asset'}</div>
                                    </div>
                                    <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2">
                                        <div className="text-[11px] uppercase tracking-wider text-gray-500">Status</div>
                                        <div className="text-sm text-gray-200">{asset.status || '—'}</div>
                                    </div>
                                    <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2">
                                        <div className="text-[11px] uppercase tracking-wider text-gray-500">Location</div>
                                        <div className="text-sm text-gray-200">{asset.location || '—'}</div>
                                    </div>
                                    <div className="rounded-md border border-[#3d2e5c] bg-[#0f0a1a] px-3 py-2">
                                        <div className="text-[11px] uppercase tracking-wider text-gray-500">Description</div>
                                        <div className="text-sm text-gray-200">{asset.description || '—'}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-gray-500">No scanned asset yet.</p>
                        )}
                    </div>

                    <DialogFooter className="pt-4 flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPrintQRModalOpen(true)}
                            disabled={!asset}
                            className="gap-2"
                        >
                            <Printer size={16} />
                            Print QR
                        </Button>
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
        </>
    )
}
