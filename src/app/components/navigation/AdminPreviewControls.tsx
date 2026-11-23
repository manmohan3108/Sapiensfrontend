import { useAuth } from '../../contexts/AuthContext';
import { usePresentation } from '../../contexts/PresentationContext';

export function AdminPreviewControls() {
  const { user } = useAuth();
  const { customerPreview, customerAnalysis, setPreview } = usePresentation();
  if (user?.role !== 'admin') return null;
  return <div className="admin-preview-controls">
    <label>View as <select value={customerPreview ? 'customer' : 'admin'}
      onChange={event => setPreview({ customer: event.target.value === 'customer', analysis: customerAnalysis })}>
      <option value="admin">Admin</option><option value="customer">Customer</option>
    </select></label>
    {customerPreview && <label><input type="checkbox" checked={customerAnalysis}
      onChange={event => setPreview({ customer: true, analysis: event.target.checked })} />Customer Analyse access</label>}
    {customerPreview && <span>Preview only · Admin data and permissions remain active.</span>}
  </div>;
}
