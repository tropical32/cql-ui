export default function Filters({ table_columns, on_submit }) {
  return (
    <div>
      <form onSubmit={on_submit}>
        {table_columns.map((col) => (
          <div key={col.column_name}>
            <label htmlFor={col.column_name}>
              {col.column_name}: <input type="text" id={col.column_name} name={col.column_name} />
            </label>
          </div>
        ))}
        <button type="submit">Filter</button>
      </form>
    </div>
  );
}
