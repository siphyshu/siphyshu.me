import React from 'react';
import { COLORS } from './handprintReducer';

const HandprintForm = ({ 
  formRef,
  formPosition,
  formName,
  formLink,
  formSelectedColor,
  onNameChange,
  onLinkChange,
  onColorSelect,
  onSubmit,
  onCancel
}) => {
  // Check if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 500;

  return (
    <div
      ref={formRef}
      className={`bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg
        ${isMobile 
          ? 'fixed bottom-0 left-0 right-0 w-full animate-slide-up rounded-t-2xl' 
          : 'absolute rounded-md border border-gray-400 w-64 m-3'}`}
      style={{
        left: isMobile ? undefined : `${formPosition.x}px`,
        top: isMobile ? undefined : `${formPosition.y}px`,
        zIndex: 20,
      }}
    >
      {/* Mobile handle */}
      {isMobile && (
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-3" />
      )}

      <form onSubmit={onSubmit} className={`space-y-4 ${isMobile ? 'p-6' : 'p-4'}`}>
        <div className="space-y-4">
          {/* Name Field */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              Your Name / Alias <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. siphyshu"
              value={formName}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border-b border-gray-300 focus:outline-none focus:border-blue-500 placeholder-gray-400 bg-transparent"
              autoFocus
              required
            />
          </div>

          {/* Website Field */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              Link (Optional)
            </label>
            <input
              placeholder="e.g. linktr.ee/yourname"
              value={formLink}
              onChange={(e) => onLinkChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border-b border-gray-300 focus:outline-none focus:border-blue-500 placeholder-gray-400 bg-transparent"
              pattern="^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$"
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              Color Picker
            </label>
            <div className="grid grid-cols-6 gap-2 py-2 px-3">
              {Object.entries(COLORS).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onColorSelect(key)}
                  className={`h-6 w-6 rounded-full transition-all ${
                    formSelectedColor === key 
                      ? "ring-2 ring-offset-1 ring-gray-800"
                      : "hover:ring-1 hover:ring-gray-200"
                  }`}
                  style={{ backgroundColor: value }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col space-y-2">
          <button
            type="submit"
            className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md transition-colors"
          >
            Imprint!
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default HandprintForm;