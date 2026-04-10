import { Activity } from 'lucide-react'

function FullPageLoader({ title = 'Loading...', subtitle }) {
    return (
        <div className="content-full">
            <div className="content-centered">
                <div className="min-h-[calc(100vh-75px)] flex items-center justify-center py-10">
                    <div className="text-center">
                        <div className="inline-block animate-spin">
                            <Activity className="text-gray-300" size={28} />
                        </div>
                        <p className="text-gray-300 mt-3 text-sm font-medium">{title}</p>
                        {subtitle ? (
                            <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FullPageLoader
