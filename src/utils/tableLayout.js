const DEFAULT_WIDTHS = {
    serial: 90,
    description: 280,
    location: 180,
    inspection_type: 150,
    status: 130,
    remarks: 260,
    attachments: 180,
    actions: 180,
};

const FALLBACK_WIDTH = 160;

export function getDefaultColumnWidth(fieldKey) {
    return DEFAULT_WIDTHS[fieldKey] || FALLBACK_WIDTH;
}

export function sanitizeColumnWidth(value, fallback = FALLBACK_WIDTH) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(640, Math.max(30, Math.round(parsed)));
}

export function buildColumnWidthMap(columns = [], savedMap = {}) {
    const map = {};
    columns.forEach((col) => {
        const key = col.field_key;
        map[key] = sanitizeColumnWidth(savedMap?.[key], getDefaultColumnWidth(key));
    });
    return map;
}

export function getColumnWidthStyle(fieldKey, widthMap = {}) {
    const width = sanitizeColumnWidth(widthMap?.[fieldKey], getDefaultColumnWidth(fieldKey));
    return {
        width: `${width}px`,
        minWidth: `${width}px`,
    };
}

export function widthPxToExcelChars(px) {
    return Math.max(8, Math.round(px / 7));
}
