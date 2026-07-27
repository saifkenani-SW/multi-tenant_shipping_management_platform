export function calculateObjectDiff(
  oldData: any,
  newData: any,
  dateFields: Set<string> = new Set(),
) {
  const diffOld: Record<string, any> = {};
  const diffNew: Record<string, any> = {};
  const proposedChanges: Record<string, { old: any; new: any }> = {};

  const allKeys = new Set([
    ...Object.keys(oldData || {}),
    ...Object.keys(newData || {}),
  ]);

  for (const key of allKeys) {
    const oldVal = oldData?.[key];
    const newVal = newData?.[key];
    if (newVal === undefined) {
      continue;
    }
    if (dateFields.has(key)) {
      const oldTime = oldVal ? new Date(oldVal).getTime() : null;
      const newTime = newVal ? new Date(newVal).getTime() : null;

      if (oldTime !== newTime) {
        diffOld[key] = oldVal || null;
        diffNew[key] = newVal || null;
        proposedChanges[key] = { old: oldVal || null, new: newVal || null };
      }
      continue;
    }

    if (oldVal !== newVal) {
      diffOld[key] = oldVal === undefined ? null : oldVal;
      diffNew[key] = newVal === undefined ? null : newVal;
      proposedChanges[key] = {
        old: oldVal === undefined ? null : oldVal,
        new: newVal === undefined ? null : newVal,
      };
    }
  }

  return { diffOld, diffNew, proposedChanges };
}
