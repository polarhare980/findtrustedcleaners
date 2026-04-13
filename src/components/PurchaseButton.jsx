'use client';

import { useRouter } from 'next/navigation';

export default function PurchaseButton({
  cleanerId,
  selectedSlot,
  onPurchaseStart,
  onPurchaseError,
  disabled = false,
}) {
  const router = useRouter();

  const slotReady = !!selectedSlot?.day && Number.isInteger(Number(selectedSlot?.hour));
  const buttonLabel = !slotReady ? 'Select a Time Slot' : 'Continue to Booking Form';

  const handleContinue = () => {
    const day = selectedSlot?.day;
    const hourNum = Number(selectedSlot?.hour);

    if (!day || !Number.isInteger(hourNum)) {
      const msg = 'Please select a time slot before continuing.';
      onPurchaseError?.(msg);
      return;
    }

    const params = new URLSearchParams({
      day,
      hour: String(hourNum),
    });

    if (selectedSlot?.date) params.set('date', String(selectedSlot.date));
    if (selectedSlot?.serviceKey) params.set('serviceKey', String(selectedSlot.serviceKey));
    if (selectedSlot?.serviceName) params.set('serviceName', String(selectedSlot.serviceName));
    if (selectedSlot?.durationMins) params.set('durationMins', String(selectedSlot.durationMins));
    if (selectedSlot?.bufferBeforeMins != null) params.set('bufferBeforeMins', String(selectedSlot.bufferBeforeMins));
    if (selectedSlot?.bufferAfterMins != null) params.set('bufferAfterMins', String(selectedSlot.bufferAfterMins));

    onPurchaseStart?.();
    router.push(`/cleaners/${cleanerId}/request?${params.toString()}`);
  };

  return (
    <button
      onClick={handleContinue}
      disabled={disabled || !slotReady}
      className={`px-6 py-3 rounded-full font-medium transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg ${
        disabled || !slotReady
          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
          : 'bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800'
      }`}
    >
      {buttonLabel}
    </button>
  );
}
