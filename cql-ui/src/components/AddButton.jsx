import React from 'react';
import PropTypes from 'prop-types';

export default function AddButton({ onAddRow, isActive }) {
  return <button type="button" disabled={!isActive} onClick={onAddRow}>Add</button>;
}

AddButton.propTypes = { onAddRow: PropTypes.func.isRequired, isActive: PropTypes.bool.isRequired };
