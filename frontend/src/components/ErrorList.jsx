export default function ErrorList({ errors }) {
  if (!errors || !errors.length) return null;
  return (
    <div className="alert alert-error">
      {errors.length === 1 ? errors[0] : (
        <>
          <strong>Please fix the following:</strong>
          <ul>{errors.map(e => <li key={e}>{e}</li>)}</ul>
        </>
      )}
    </div>
  );
}
