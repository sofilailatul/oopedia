export function normalizeCsvHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function parseCsvText(text) {
  const safeText = String(text ?? "")
    .replace(/^\ufeff/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < safeText.length; i += 1) {
    const char = safeText[i];

    if (inQuotes) {
      if (char === '"') {
        if (safeText[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  rows.push(row);

  const cleanedRows = rows.filter((cells) =>
    cells.some((cell) => String(cell ?? "").trim().length > 0),
  );

  if (cleanedRows.length === 0) {
    return {
      headers: [],
      normalizedHeaders: [],
      rows: [],
    };
  }

  const headers = cleanedRows.shift() ?? [];
  const normalizedHeaders = headers.map(normalizeCsvHeader);

  return {
    headers,
    normalizedHeaders,
    rows: cleanedRows,
  };
}

export function getCsvValue(row, normalizedHeaders, aliases) {
  for (const alias of aliases) {
    const key = normalizeCsvHeader(alias);
    const index = normalizedHeaders.indexOf(key);
    if (index !== -1) {
      return row[index] ?? "";
    }
  }

  return "";
}
