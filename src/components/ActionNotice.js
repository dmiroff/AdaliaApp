import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function ActionNotice({notice, onDismiss}) {
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => {
    if (!notice || notice.variant === 'error') return;
    const timer = setTimeout(() => dismiss.current(), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  if (!notice) return null;
  const isError = notice.variant === 'error';
  return createPortal(<div className={`action-notice ${isError ? 'action-notice--error' : ''}`}
    role={isError ? 'alert' : 'status'} aria-atomic="true">
    <span>{notice.message}</span>
    <button type="button" onClick={onDismiss} aria-label="Закрыть уведомление">×</button>
  </div>, document.body);
}
