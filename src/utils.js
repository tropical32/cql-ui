export function objects_equal(obj_a, obj_b) {
  let keys_obj_a = Object.keys(obj_a);
  let keys_obj_b = Object.keys(obj_b);

  if (keys_obj_a.length !== keys_obj_b.length) {
    return false;
  }

  for (const key of keys_obj_a) {
    if (obj_a[key] !== obj_b[key]) {
      return false;
    }
  }

  return true;
}
