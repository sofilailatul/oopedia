import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

/**
 * Custom hook to manage Shepherd.js tours
 * @param {Object} options - Shepherd tour options + optional storageKey
 * @param {string} [options.storageKey] - localStorage key untuk tracking apakah tour sudah pernah dilihat
 * @returns {Object} - The tour instance, startTour, checkAndStart, dan control functions
 */
export const useTour = (options = {}) => {
  const { storageKey, ...tourOptions } = options;
  const tourRef = useRef(null);

  useEffect(() => {
    tourRef.current = new Shepherd.Tour({
      useModalOverlay: true,
      modalOverlayOpeningRadius: 20,
      modalOverlayOpeningPadding: 10,
      defaultStepOptions: {
        classes: 'shadow-md bg-purple-dark',
        scrollTo: { behavior: 'smooth', block: 'center' },
        cancelIcon: {
          enabled: true
        }
      },
      ...tourOptions
    });

    // Tandai tour selesai di localStorage hanya saat user benar-benar complete/cancel
    let markDone = null;
    if (storageKey) {
      markDone = () => localStorage.setItem(storageKey, '1');
      tourRef.current.on('complete', markDone);
      tourRef.current.on('cancel', markDone);
    }

    return () => {
      if (tourRef.current) {
        // Hapus listener dulu agar cleanup tidak trigger markDone
        if (markDone) {
          tourRef.current.off('complete', markDone);
          tourRef.current.off('cancel', markDone);
        }
        // Hide saja tanpa trigger event
        try { tourRef.current.hide(); } catch (_) {}
      }
    };
  }, []);

  const addSteps = (steps) => {
    if (tourRef.current) {
      tourRef.current.addSteps(steps);
    }
  };

  const startTour = () => {
    if (tourRef.current) {
      tourRef.current.start();
    }
  };

  /**
   * Auto-start tour hanya jika pertama kali (storageKey belum ada di localStorage).
   * Delay kecil untuk memastikan DOM sudah siap.
   */
  const checkAndStart = (delay = 600) => {
    if (!storageKey || localStorage.getItem(storageKey)) return;
    setTimeout(() => {
      try {
        if (tourRef.current) {
          tourRef.current.start();
        }
      } catch (e) {
        console.warn('[useTour] Gagal memulai tour:', e);
      }
    }, delay);
  };

  const next = () => tourRef.current?.next();
  const back = () => tourRef.current?.back();
  const cancel = () => tourRef.current?.cancel();
  const complete = () => tourRef.current?.complete();

  return { tour: tourRef.current, startTour, checkAndStart, next, back, cancel, complete, addSteps };
};

