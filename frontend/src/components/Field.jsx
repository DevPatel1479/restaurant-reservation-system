// components/Field.jsx


export default function Field({ label, error, className = '', ...props }) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      <input className="field-input" {...props} />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}