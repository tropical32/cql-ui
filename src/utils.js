export function objects_equal(obj_a, obj_b) {
  let keys_obj_a = Object.keys(obj_a);
  let keys_obj_b = Object.keys(obj_b);

  if (keys_obj_a.length !== keys_obj_b.length) {
    return false;
  }

  for (const key of keys_obj_a) {
    let obj_a_val = obj_a[key] ?? "";
    let obj_b_val = obj_b[key] ?? "";

    if (obj_a_val.toString() !== obj_b_val.toString()) {
      return false;
    }
  }

  return true;
}
