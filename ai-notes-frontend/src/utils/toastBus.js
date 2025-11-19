const handlers = new Set();

export function subscribe(handler) {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

export function pushToast(message, variant = 'success', timeout = 3200) {
  handlers.forEach(h => {
    try { h({ message, variant, timeout }); } catch (e) { console.error('toast handler error', e); }
  });
}
