export default function Modal({ titulo, subtitulo, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* Contenido */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{titulo}</h2>
              {subtitulo && <p className="text-sm text-gray-500 mt-0.5">{subtitulo}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-500 shrink-0 ml-4"
            >
              ×
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}