export function objectsEqual(objA, objB) {
  const keysObjA = Object.keys(objA);
  const keysObjB = Object.keys(objB);

  if (keysObjA.length !== keysObjB.length) {
    return false;
  }

  return keysObjA.every((key) => {
    const objAVal = objA[key];
    const objBVal = objB[key];

    return objAVal === objBVal;
  });
}

export default { objectsEqual };
