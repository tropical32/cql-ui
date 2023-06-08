export default function AddButton({ on_add_row, is_active }) {
  return <button disabled={!is_active} onClick={on_add_row}>Add</button>
}
