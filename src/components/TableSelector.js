export default function TableSelector({ tables, on_change }) {
  console.log("tables", tables);
  return (
    <div>
      <label htmlFor="tables">Table: </label>
      <select id="tables" name="tables" onChange={on_change}>
        <option></option>
        {tables.map(table => <option key={table} value={table}>{table}</option>)}
      </select>
    </div>
  );
}
