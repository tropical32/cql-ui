export default function TableSelector({ tables, onChange }) {
  return (
    <div>
      <label htmlFor="tables">Table: </label>
      <select id="tables" name="tables" onChange={onChange}>
        <option></option>
        {tables.map(table => <option key={table} value={table}>{table}</option>)}
      </select>
    </div>
  );
}
