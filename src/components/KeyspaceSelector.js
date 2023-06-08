export default function KeyspaceSelector({ keyspaces, on_change }) {
  return (
    <div>
      <label htmlFor="keyspaces">Keyspace: </label>
      <select id="keyspaces" name="keyspaces" onChange={on_change}>
        <option></option>
        {keyspaces.map(table => <option key={table} value={table}>{table}</option>)}
      </select>
    </div>
  );

}
