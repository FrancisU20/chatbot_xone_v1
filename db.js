const Excel = require("exceljs");

// Función para leer el archivo de Excel y obtener la información de la Hoja1
async function readExcelFile(filename) {
  const workbook = new Excel.Workbook();

  try {
    await workbook.xlsx.readFile(filename);
    const worksheet = workbook.getWorksheet("Indice"); // Cambia 'Hoja1' al nombre de tu hoja

    const data = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber !== 1) {
        // Ignorar encabezados
        const rowData = [];
        row.eachCell((cell) => {
          // Obtener el valor de la celda
          const cellValue = cell.text || cell.value;
          // Verificar si la celda está vacía o si su valor es null o undefined
          if (
            cellValue === null ||
            cellValue === undefined ||
            cellValue.toString().trim() === ""
          ) {
            rowData.push("PENDIENTE");
          } else {
            rowData.push(cellValue);
          }
        });
        data.push(rowData);
      }
    });
    return data;
  } catch (error) {
    console.error("Error reading Excel file:", error.message);
    return [];
  }
}

module.exports = { readExcelFile };
