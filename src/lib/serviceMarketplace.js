function cleanLabel(value = '') {
  return String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCase(value = '') {
  return cleanLabel(value).replace(/\b\w/g, (m) => m.toUpperCase());
}

function slugify(value = '') {
  return cleanLabel(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildServiceMarket(cleaners = [], limit = 10) {
  const bucket = new Map();

  for (const cleaner of cleaners || []) {
    const detailed = Array.isArray(cleaner?.servicesDetailed) ? cleaner.servicesDetailed : [];
    const fallback = Array.isArray(cleaner?.services) ? cleaner.services : [];
    const seenForCleaner = new Set();

    for (const svc of detailed) {
      if (!svc || svc.active === false) continue;
      const rawName = svc.name || svc.key;
      const label = titleCase(rawName);
      if (!label) continue;
      const key = slugify(rawName || label);
      if (!key || seenForCleaner.has(key)) continue;
      seenForCleaner.add(key);

      const current = bucket.get(key) || {
        key,
        label,
        cleanerCount: 0,
        pricedCount: 0,
        prices: [],
        durations: [],
      };

      current.cleanerCount += 1;
      const price = Number(svc.price ?? svc.basePrice);
      if (Number.isFinite(price) && price > 0) {
        current.pricedCount += 1;
        current.prices.push(price);
      }
      const mins = Number(svc.defaultDurationMins || svc.minDurationMins);
      if (Number.isFinite(mins) && mins > 0) current.durations.push(mins);
      bucket.set(key, current);
    }

    for (const name of fallback) {
      const label = titleCase(name);
      if (!label) continue;
      const key = slugify(name || label);
      if (!key || seenForCleaner.has(key)) continue;
      seenForCleaner.add(key);

      const current = bucket.get(key) || {
        key,
        label,
        cleanerCount: 0,
        pricedCount: 0,
        prices: [],
        durations: [],
      };
      current.cleanerCount += 1;
      bucket.set(key, current);
    }
  }

  return [...bucket.values()]
    .map((item) => {
      const minPrice = item.prices.length ? Math.min(...item.prices) : null;
      const avgDurationMins = item.durations.length
        ? Math.round(item.durations.reduce((sum, v) => sum + v, 0) / item.durations.length)
        : null;
      return {
        ...item,
        minPrice,
        avgDurationMins,
      };
    })
    .sort((a, b) => {
      if (b.cleanerCount !== a.cleanerCount) return b.cleanerCount - a.cleanerCount;
      if ((a.minPrice ?? Infinity) !== (b.minPrice ?? Infinity)) return (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity);
      return a.label.localeCompare(b.label);
    })
    .slice(0, limit);
}
