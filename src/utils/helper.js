export const cleanCurrency = (value) => {
    if (!value) return 0;

    if (typeof value === 'number') return value;

    let stringValue = value.toString();

    stringValue = stringValue.replace(/[^\d,-]/g, '');

    stringValue = stringValue.replace(',', '.');

    return parseFloat(stringValue) || 0;
};

export const parseExcelDate = (excelDate) => {
    if (!excelDate) return null;
    return new Date((excelDate - (25567 + 2)) * 86400 * 1000);
};