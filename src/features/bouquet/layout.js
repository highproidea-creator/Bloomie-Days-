export function layoutPosition(index, count, style = "round") {
  if (count === 1) return [0, 2.65, 0];
  const angle = index * 2.399963,
    radius =
      Math.sqrt((index + 0.45) / count) * (0.68 + Math.sqrt(count) * 0.12);
  let x = Math.cos(angle) * radius,
    y = 2.65 + Math.sin(angle) * radius * 0.68,
    z = Math.cos(angle * 1.7) * 0.23;
  if (style === "hand-tied") {
    x *= 1.08;
    y += Math.sin(index * 1.9) * 0.17;
    z *= 1.5;
  }
  if (style === "cascading" && index >= Math.ceil(count * 0.6)) {
    const p =
      (index - Math.ceil(count * 0.6) + 1) /
      Math.max(1, count - Math.ceil(count * 0.6));
    x = Math.sin(index * 2.1) * (0.55 - p * 0.25);
    y = 2.5 - p * 0.9;
    z = 0.55 + p * 0.15;
  }
  if (style === "asymmetrical") {
    x += 0.2;
    y += x * 0.35;
  }
  if (style === "garden") {
    x *= 1.12;
    y += Math.sin(index * 2.7) * 0.24;
    z *= 1.7;
  }
  if (style === "minimal") {
    x *= 0.65;
    y += Math.sin(angle) * 0.22;
    z *= 0.6;
  }
  return constrainPosition([x, y, z]);
}
export function constrainPosition(value) {
  const bounds = [
    [-2.4, 2.4],
    [1.6, 4.2],
    [-1.1, 1.1],
  ];
  return value.map(
    (v, i) =>
      Math.round(Math.max(bounds[i][0], Math.min(bounds[i][1], v)) * 1000) /
      1000,
  );
}
export function arrangeStems(stems, style, preserveManual = false) {
  return stems.map((stem, i) =>
    preserveManual && stem.manual
      ? stem
      : {
          ...stem,
          position: layoutPosition(i, stems.length, style),
          manual: false,
        },
  );
}
