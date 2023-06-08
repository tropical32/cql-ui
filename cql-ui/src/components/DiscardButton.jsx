import React from 'react';
import PropTypes from 'prop-types';

export default function DiscardButton({ onDiscardChanges }) {
  return <button type="button" onClick={onDiscardChanges}>Discard</button>;
}

DiscardButton.propTypes = { onDiscardChanges: PropTypes.func.isRequired };
