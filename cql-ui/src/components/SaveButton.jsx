import React from 'react';
import PropTypes from 'prop-types';

export default function SaveButton({ onSave }) {
  return <button type="button" onClick={onSave}>Save</button>;
}

SaveButton.propTypes = {
  onSave: PropTypes.func.isRequired,
};
