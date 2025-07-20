// src/lib/utils.js

export function getCleanerId(cleaner, fallbackId = null) {
  return cleaner?._id || cleaner?.id || cleaner?.cleanerId || fallbackId;
}

