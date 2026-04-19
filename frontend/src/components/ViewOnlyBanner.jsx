import { Eye } from 'lucide-react'

export function ViewOnlyBanner() {
    return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900/30 border border-blue-500/50 text-blue-200 text-sm font-medium">
            <Eye size={16} />
            View-only mode
        </div>
    )
}
