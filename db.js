const Excel = require('exceljs');

// Función para leer el archivo de Excel y obtener la información de la Hoja1
async function readExcelFile(filename) {
  const workbook = new Excel.Workbook();
  
  try {
    await workbook.xlsx.readFile(filename);
    const worksheet = workbook.getWorksheet('Hoja1'); // Cambia 'Hoja1' al nombre de tu hoja
    
    const data = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber !== 1) { // Ignorar encabezados
        const rowData = [];
        row.eachCell((cell) => {
          if (cell.value === null) {
            rowData.push("CELDAS VACÍAS");
          } else {
            rowData.push(cell.value);
          }
        });
        data.push(rowData);
      }
    });
    
    return data;
  } catch (error) {
    console.error('Error reading Excel file:', error.message);
    return [];
  }
}

module.exports = { readExcelFile };
