// src/components/LoadingSpinner.js
export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-teal-600 border-solid"></div>
    </div>
  );
}
