import React from 'react';
import PropTypes from 'prop-types';

export default function KeyspaceSelector({ keyspaces, onChange }) {
  return (
    <div>
      <label htmlFor="keyspaces">
        Keyspace:
        <select id="keyspaces" name="keyspaces" onChange={(event) => onChange(event.target.value)}>
          <option aria-label="<empty>" />
          {keyspaces.map((table) => <option key={table} value={table}>{table}</option>)}
        </select>
      </label>
    </div>
  );
}

KeyspaceSelector.propTypes = {
  keyspaces: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
};
