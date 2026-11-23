import { useAuth } from '../../contexts/AuthContext';
import { usePresentation } from '../../contexts/PresentationContext';

export function AdminPreviewControls() {
  const { user } = useAuth();
  const { customerPreview, customerAnalysis, setPreview } = usePresentation();
  const disclosure = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (disclosure.current && event.target instanceof Node && !disclosure.current.contains(event.target)) disclosure.current.open = false;
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);
  if (user?.role !== 'admin') return null;
  return <details ref={disclosure} className="admin-preview-controls" onKeyDown={event => {
    if (event.key === 'Escape') {
      event.currentTarget.open = false;
      event.currentTarget.querySelector('summary')?.focus();
      event.stopPropagation();
    }
  }}>
    <summary><span>View as:</span> <strong>{customerPreview ? 'Customer' : 'Admin'}</strong></summary>
    <div className="admin-preview-panel">
    <label>View as <select value={customerPreview ? 'customer' : 'admin'}
      onChange={event => setPreview({ customer: event.target.value === 'customer', analysis: customerAnalysis })}>
      <option value="admin">Admin</option><option value="customer">Customer</option>
    </select></label>
    {customerPreview && <label><input type="checkbox" checked={customerAnalysis}
      onChange={event => setPreview({ customer: true, analysis: event.target.checked })} />Customer Analyse access</label>}
    {customerPreview && <span>Preview only · Admin data and permissions remain active.</span>}
    </div>
  </details>;
}
import { useEffect, useRef } from 'react';
