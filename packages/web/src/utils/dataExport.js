// Web data export utilities using jsPDF and PapaParse
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

export function exportMaintenanceAsCSV(maintenanceEntries, vehicle) {
  const csvData = maintenanceEntries.map(entry => ({
    Date: entry.date.toLocaleDateString(),
    Title: entry.title,
    Cost: entry.cost?.toFixed(2) || '0.00',
    Mileage: entry.mileage || '',
    Notes: entry.notes || '',
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `maintenance_${vehicle.vin}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportMaintenanceAsPDF(maintenanceEntries, vehicle) {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text('Vehicle Maintenance History', 20, 20);

  // Add vehicle info
  doc.setFontSize(12);
  doc.text(`VIN: ${vehicle.vin}`, 20, 35);
  doc.text(`Vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.year})`, 20, 45);

  // Prepare table data
  const tableData = maintenanceEntries.map(entry => [
    entry.date.toLocaleDateString(),
    entry.title,
    `$${entry.cost?.toFixed(2) || '0.00'}`,
    entry.mileage?.toString() || '',
    entry.notes || '',
  ]);

  // Add table
  doc.autoTable({
    head: [['Date', 'Title', 'Cost', 'Mileage', 'Notes']],
    body: tableData,
    startY: 55,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue header
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Save the PDF
  doc.save(`maintenance_${vehicle.vin}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportAllVehiclesAsPDF(vehicles, getMaintenanceForVehicle) {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text('Complete Vehicle Report', 20, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);

  let yPosition = 45;

  // Add each vehicle
  for (const vehicle of vehicles) {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Vehicle header
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`${vehicle.make} ${vehicle.model} (${vehicle.year})`, 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`VIN: ${vehicle.vin} | Mileage: ${vehicle.mileage || 'N/A'} miles`, 20, yPosition);
    yPosition += 15;

    // Get maintenance entries for this vehicle
    const maintenanceEntries = getMaintenanceForVehicle(vehicle.vin);

    if (maintenanceEntries.length > 0) {
      const tableData = maintenanceEntries.slice(0, 10).map(entry => [
        entry.date.toLocaleDateString(),
        entry.title,
        `$${entry.cost?.toFixed(2) || '0.00'}`,
        entry.mileage?.toString() || '',
      ]);

      doc.autoTable({
        head: [['Date', 'Service', 'Cost', 'Mileage']],
        body: tableData,
        startY: yPosition,
        styles: {
          fontSize: 7,
          cellPadding: 1,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 20, right: 20 },
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    } else {
      doc.text('No maintenance records found.', 20, yPosition);
      yPosition += 10;
    }

    yPosition += 10; // Space between vehicles
  }

  // Save the PDF
  doc.save(`complete_vehicle_report_${new Date().toISOString().split('T')[0]}.pdf`);
}