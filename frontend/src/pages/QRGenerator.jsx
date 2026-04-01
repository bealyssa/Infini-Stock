import { QrCode, Zap } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'

function QRGenerator() {
    return (
        <div className="content-full bg-[#171717]">
            <div className="content-centered max-w-3xl">
                <div className="py-8">
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-2">
                        <QrCode className="text-gray-300" size={36} />
                        QR Code Generator
                    </h1>
                    <p className="text-gray-400">
                        Create unique QR codes for new assets
                    </p>
                </div>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Create New Asset QR Code</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-3">
                                    Asset Type *
                                </label>
                                <Select>
                                    <option value="">Select type...</option>
                                    <option value="unit">
                                        System Unit
                                    </option>
                                    <option value="monitor">Monitor</option>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-3">
                                    Asset Tag (optional)
                                </label>
                                <Input
                                    type="text"
                                    placeholder="AST-2026-0001 (auto-generated if empty)"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-3">
                                    Description
                                </label>
                                <Input
                                    type="text"
                                    placeholder="e.g., Dell Monitor 27-inch, HP Desktop Unit"
                                />
                            </div>

                            <Button className="w-full">
                                <Zap className="mr-2" size={20} />
                                Generate QR Code
                            </Button>
                        </form>

                        <div className="mt-8 p-8 bg-[#171717] border-2 border-dashed border-[#404040] rounded-lg text-center hover:border-[#505050] transition-colors">
                            <QrCode className="text-gray-600 mx-auto mb-4" size={48} />
                            <p className="text-gray-400 mb-2">
                                Generated QR code will appear here
                            </p>
                            <p className="text-gray-500 text-sm">
                                You can download and print it
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default QRGenerator
