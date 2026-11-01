// simple yes/no popup used before deleting things
export default function ConfirmModal({ open, title, message, onConfirm, onCancel, busy }) {
  if (!open) return null;
  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="btn-row right">
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
