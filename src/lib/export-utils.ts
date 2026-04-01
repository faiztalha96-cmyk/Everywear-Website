/**
 * Utilities for exporting data to various formats
 */

/**
 * Downloads a CSV file from an array of objects
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 * @param headers Optional custom headers mapping { key: "Header Name" }
 */
export function downloadCSV(data: any[], filename: string, headers?: Record<string, string>) {
  if (!data || data.length === 0) return;

  const keys = Object.keys(headers || data[0]);
  const headerRow = headers 
    ? Object.values(headers).join(',') 
    : keys.join(',');

  const rows = data.map(item => {
    return keys.map(key => {
      let value = item[key];
      
      // Handle null/undefined
      if (value === null || value === undefined) value = '';
      
      // Handle objects/arrays (stringify)
      if (typeof value === 'object') value = JSON.stringify(value);
      
      // Escape double quotes and wrap in quotes if contains comma
      const stringValue = String(value).replace(/"/g, '""');
      return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
        ? `"${stringValue}"`
        : stringValue;
    }).join(',');
  });

  const csvContent = [headerRow, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
