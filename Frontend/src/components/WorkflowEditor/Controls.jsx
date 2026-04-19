import { Save, RotateCcw, Loader2 } from 'lucide-react'

/**
 * Control buttons for workflow actions
 */
const Controls = ({ onSave, onReset, saving = false, disabled = false }) => {
    return (
        <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 flex flex-col sm:flex-row gap-2 z-[100]">
            {/* Save Button */}
            <button
                onClick={onSave}
                disabled={disabled || saving}
                className={`
                    flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-medium shadow-lg
                    transition-all duration-200 text-sm sm:text-base
                    ${disabled || saving
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:shadow-xl'
                    }
                `}
                title="Save workflow"
            >
                {saving ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="hidden sm:inline">Saving...</span>
                        <span className="sm:hidden">Save</span>
                    </>
                ) : (
                    <>
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                    </>
                )}
            </button>

            {/* Reset Button */}
            <button
                onClick={onReset}
                disabled={disabled || saving}
                className={`
                    flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-medium shadow-lg
                    transition-all duration-200 text-sm sm:text-base
                    ${disabled || saving
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white hover:shadow-xl'
                    }
                `}
                title="Reset to last saved state"
            >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
            </button>
        </div>
    )
}

export default Controls
