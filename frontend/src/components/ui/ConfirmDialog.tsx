import React from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  buttons?: { label: string; action: () => void; className: string }[];
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Delete",
  cancelText = "Cancel",
  confirmButtonClass = "bg-red-500 hover:bg-red-600 text-white",
  buttons,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white dark:bg-black bg-opacity-80 dark:bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-200">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-200 scale-100 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          {message}
        </p>
        {buttons ? (
          <div className="flex flex-col gap-3 mt-2">
            {buttons.map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.action}
                className={btn.className}
              >
                {btn.label}
              </button>
            ))}
            <button
              onClick={onCancel}
              className="mt-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors underline"
            >
              {cancelText}
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all duration-200 rounded-lg border border-gray-300 dark:border-gray-600"
            >
              {cancelText}
            </button>
            {onConfirm && (
              <button
                onClick={onConfirm}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg ${confirmButtonClass}`}
              >
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
