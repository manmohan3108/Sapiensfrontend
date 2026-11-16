import { useId, useState } from 'react';
import type { ConnectionFormValue, ProviderField } from '../../types/connectionTypes';

interface FieldProps {
  field: ProviderField;
  value: ConnectionFormValue;
  error?: string;
  editing: boolean;
  busy: boolean;
  onChange: (name: string, value: ConnectionFormValue) => void;
}

function ConnectionField({ field, value, error, editing, busy, onChange }: FieldProps) {
  const id = useId();
  const secret = field.type === 'password' || field.source === 'credential';
  const required = field.required && !(editing && secret);
  const choice = field.choice_details?.[String(value ?? '')];
  const help = [choice?.description, field.help_text, editing && secret ? 'Leave blank to keep the saved value. It is never displayed.' : ''].filter(Boolean).join(' ');
  const describedBy = [help ? `${id}-help` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  const style = 'w-full rounded-lg border border-sp-line bg-sp-panel px-3 py-2.5 text-sm text-sp-ink disabled:opacity-40';
  return <div className={field.type === 'boolean' || field.type === 'url' ? 'sm:col-span-2' : 'min-w-0'}>
    <label htmlFor={id} className="mb-1.5 block text-sm">{field.label}{required && <span className="ml-1 text-sp-danger">*</span>}</label>
    {field.type === 'boolean'
      ? <input id={id} name={field.name} type="checkbox" checked={Boolean(value)} disabled={busy}
          onChange={event => onChange(field.name, event.target.checked)} aria-describedby={describedBy} className="h-5 w-5" />
      : field.choices !== undefined
        ? <select id={id} name={field.name} value={String(value ?? '')} disabled={busy || field.choices.length === 0} aria-invalid={Boolean(error)} aria-describedby={describedBy}
            onChange={event => onChange(field.name, event.target.value)} className={style}>
            <option value="">{field.choices.length ? `Choose ${field.label.toLowerCase()}…` : 'No options available'}</option>
            {value && !field.choices.includes(String(value)) && <option value={String(value)} disabled>{String(value)} (unsupported value)</option>}
            {field.choices.map(choice => <option key={choice} value={choice}>{field.choice_details?.[choice]?.label ?? choice}</option>)}
          </select>
        : <input id={id} name={field.name} type={field.type} value={String(value ?? '')} disabled={busy}
            spellCheck={false} autoComplete={secret ? 'new-password' : 'off'} placeholder={field.placeholder}
            aria-invalid={Boolean(error)} aria-describedby={describedBy}
            onChange={event => onChange(field.name, event.target.value)} className={style} />}
    {help && <p id={`${id}-help`} className="mt-1 text-sm text-sp-muted">{help}</p>}
    {error && <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-sp-danger">{error}</p>}
  </div>;
}

export function ConnectionFields({ fields, values, errors, editing, busy, onChange }: {
  fields: ProviderField[];
  values: Record<string, ConnectionFormValue>;
  errors: Record<string, string>;
  editing: boolean;
  busy: boolean;
  onChange: FieldProps['onChange'];
}) {
  const [expanded, setExpanded] = useState(false);
  // Required fields stay visible even if a provider labels them advanced.
  const basic = fields.filter(field => !field.advanced || field.required);
  const advanced = fields.filter(field => field.advanced && !field.required);
  const advancedError = advanced.some(field => Boolean(errors[field.name]));
  const renderField = (field: ProviderField) => <ConnectionField key={field.name} field={field} value={values[field.name]}
    error={errors[field.name]} editing={editing} busy={busy} onChange={onChange} />;
  return <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">{basic.map(renderField)}</div>
    {advanced.length > 0 && <details open={expanded || advancedError} onToggle={event => setExpanded(event.currentTarget.open)}>
      <summary className="cursor-pointer text-sm font-medium">Advanced settings (optional)</summary>
      <p className="my-3 text-sm text-sp-muted">Ask an administrator if these settings are needed. Saved values remain in use when you leave this section closed.</p>
      <div className="grid gap-4 sm:grid-cols-2">{advanced.map(renderField)}</div>
    </details>}
  </div>;
}
