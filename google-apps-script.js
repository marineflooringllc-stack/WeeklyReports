/**
 * PASTE THIS CODE INTO GOOGLE APPS SCRIPT
 * Marine Flooring LLC - Database Backend
 */

const MAIN_SHEET_NAME = "WeeklyReports";
const DELETED_SHEET_NAME = "Deleted Reports";
const FOREMEN_SHEET_NAME = "Foremen";
const PTP_SHEET_NAME = "PreTaskPlans";
const DELETED_PTP_SHEET_NAME = "DeletedPreTaskPlans";
const AUDIT_LOG_SHEET_NAME = "AuditLogs";

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'ping') return createJsonResponse({ status: "ok", message: "Marine Flooring Backend is Online" });
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist(ss);
  
  let sheetName;
  if (action === 'fetchDeleted') sheetName = DELETED_SHEET_NAME;
  else if (action === 'fetchForemen') sheetName = FOREMEN_SHEET_NAME;
  else if (action === 'fetchPTPs') sheetName = PTP_SHEET_NAME;
  else if (action === 'fetchDeletedPTPs') sheetName = DELETED_PTP_SHEET_NAME;
  else if (action === 'fetchAuditLogs') sheetName = AUDIT_LOG_SHEET_NAME;
  else sheetName = MAIN_SHEET_NAME;

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return createJsonResponse({ error: "Sheet " + sheetName + " not found" });
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse([]);

  const headers = data[0];
  const rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => { 
      obj[header] = row[index]; 
    });
    return obj;
  });

  return createJsonResponse(rows);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist(ss);
  
  let request;
  try { 
    request = JSON.parse(e.postData.contents); 
  } catch (err) { 
    return createJsonResponse({ error: "Invalid JSON" }); 
  }

  const { action, data } = request;
  
  try {
    switch (action) {
      case 'insert': return insertRow(ss, MAIN_SHEET_NAME, data);
      case 'update': return updateRow(ss, MAIN_SHEET_NAME, data);
      case 'delete': return moveRow(ss, MAIN_SHEET_NAME, DELETED_SHEET_NAME, data.id);
      case 'restore': return moveRow(ss, DELETED_SHEET_NAME, MAIN_SHEET_NAME, data.id);
      case 'upsertForeman': return upsertForeman(ss, data);
      case 'deleteForeman': return deleteForeman(ss, data.name);
      case 'insertPTP': return insertPTP(ss, data);
      case 'updatePTP': return updatePTP(ss, data);
      case 'deletePTP': return moveRow(ss, PTP_SHEET_NAME, DELETED_PTP_SHEET_NAME, data.id);
      case 'restorePTP': return moveRow(ss, DELETED_PTP_SHEET_NAME, PTP_SHEET_NAME, data.id);
      case 'insertAuditLog': return insertAuditLog(ss, data);
      default: return createJsonResponse({ error: "Unknown action: " + action });
    }
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

/**
 * Robust ID Normalization
 */
function normalizeId(val) {
  if (val === null || val === undefined) return "";
  let str;
  if (typeof val === 'number') {
    str = val.toLocaleString('fullwide', {useGrouping:false});
  } else {
    str = String(val);
  }
  return str.replace(/\D/g, "");
}

function findRowIndex(sheet, id) {
  const target = normalizeId(id);
  if (!target) return null;
  
  const range = sheet.getRange(1, 1, sheet.getLastRow(), 1);
  const values = range.getValues();
  const displayValues = range.getDisplayValues();
  
  for (let i = 1; i < values.length; i++) {
    if (normalizeId(values[i][0]) === target || normalizeId(displayValues[i][0]) === target) {
      return i + 1;
    }
  }
  return null;
}

function insertRow(ss, sheetName, report) {
  const sheet = ss.getSheetByName(sheetName);
  const rowData = [
    String(report.id), 
    report.vessel, 
    report.weekStart, 
    report.weekEnd, 
    JSON.stringify(report.compartments), 
    report.createdAt || new Date().toISOString(), 
    report.author || report.Author || "Unknown",
    report.lastEditor || report.LastEditor || "",
    report.updatedAt || report.UpdatedAt || "",
    JSON.stringify(report.editLog || [])
  ];
  sheet.appendRow(rowData);
  sheet.getRange(sheet.getLastRow(), 1).setNumberFormat("@");
  SpreadsheetApp.flush();
  return createJsonResponse({ success: true });
}

function updateRow(ss, sheetName, report) {
  const sheet = ss.getSheetByName(sheetName);
  const rowIndex = findRowIndex(sheet, report.id);
  
  if (rowIndex) {
    const rowData = [
      String(report.id), 
      report.vessel, 
      report.weekStart, 
      report.weekEnd, 
      JSON.stringify(report.compartments), 
      report.createdAt,
      report.author || report.Author || "Unknown",
      report.lastEditor || report.LastEditor || "",
      report.updatedAt || report.UpdatedAt || "",
      JSON.stringify(report.editLog || [])
    ];
    sheet.getRange(rowIndex, 1, 1, 10).setValues([rowData]);
    sheet.getRange(rowIndex, 1).setNumberFormat("@");
    SpreadsheetApp.flush();
    return createJsonResponse({ success: true });
  }
  return createJsonResponse({ error: "ID not found" });
}

function moveRow(ss, fromSheetName, toSheetName, id) {
  const fromSheet = ss.getSheetByName(fromSheetName);
  const toSheet = ss.getSheetByName(toSheetName);
  
  if (!fromSheet || !toSheet) return createJsonResponse({ error: "Sheet missing" });

  const rowIndex = findRowIndex(fromSheet, id);
  if (rowIndex) {
    const rowData = fromSheet.getRange(rowIndex, 1, 1, fromSheet.getLastColumn()).getValues()[0];
    toSheet.appendRow(rowData);
    toSheet.getRange(toSheet.getLastRow(), 1).setNumberFormat("@");
    fromSheet.deleteRow(rowIndex);
    SpreadsheetApp.flush();
    return createJsonResponse({ success: true });
  }
  return createJsonResponse({ error: "ID " + id + " not found" });
}

function upsertForeman(ss, foreman) {
  const sheet = ss.getSheetByName(FOREMEN_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === foreman.name) {
      sheet.getRange(i + 1, 2).setValue(String(foreman.pin));
      return createJsonResponse({ success: true });
    }
  }
  sheet.appendRow([foreman.name, String(foreman.pin)]);
  return createJsonResponse({ success: true });
}

function deleteForeman(ss, name) {
  const sheet = ss.getSheetByName(FOREMEN_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === name) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ success: true });
    }
  }
  return createJsonResponse({ error: "Foreman not found" });
}

function insertPTP(ss, ptp) {
  const sheet = ss.getSheetByName(PTP_SHEET_NAME);
  sheet.appendRow([
    String(ptp.id), ptp.date, ptp.description, ptp.supervisor, ptp.location, ptp.company, JSON.stringify(ptp.evaluation), JSON.stringify(ptp.hazards), JSON.stringify(ptp.ppe), JSON.stringify(ptp.steps), ptp.author, ptp.createdAt
  ]);
  sheet.getRange(sheet.getLastRow(), 1).setNumberFormat("@");
  SpreadsheetApp.flush();
  return createJsonResponse({ success: true });
}

function updatePTP(ss, ptp) {
  const sheet = ss.getSheetByName(PTP_SHEET_NAME);
  const rowIndex = findRowIndex(sheet, ptp.id);
  
  if (rowIndex) {
    sheet.getRange(rowIndex, 1, 1, 12).setValues([[
      String(ptp.id), ptp.date, ptp.description, ptp.supervisor, ptp.location, ptp.company, JSON.stringify(ptp.evaluation), JSON.stringify(ptp.hazards), JSON.stringify(ptp.ppe), JSON.stringify(ptp.steps), ptp.author, ptp.createdAt
    ]]);
    sheet.getRange(rowIndex, 1).setNumberFormat("@");
    SpreadsheetApp.flush();
    return createJsonResponse({ success: true });
  }
  return createJsonResponse({ error: "PTP Not found" });
}

function insertAuditLog(ss, log) {
  const sheet = ss.getSheetByName(AUDIT_LOG_SHEET_NAME);
  sheet.appendRow([
    String(log.id), log.timestamp, log.user, log.action, log.details
  ]);
  sheet.getRange(sheet.getLastRow(), 1).setNumberFormat("@");
  SpreadsheetApp.flush();
  return createJsonResponse({ success: true });
}

function ensureSheetsExist(ss) {
  const reportHeaders = ["ID", "Vessel", "WeekStart", "WeekEnd", "CompartmentsData", "CreatedAt", "Author", "LastEditor", "UpdatedAt", "EditLog"];
  const ptpHeaders = ["ID", "Date", "Description", "Supervisor", "Location", "Company", "Evaluation", "Hazards", "PPE", "Steps", "Author", "CreatedAt"];
  const foremanHeaders = ["Name", "PIN"];
  const auditHeaders = ["ID", "Timestamp", "User", "Action", "Details"];
  
  if (!ss.getSheetByName(MAIN_SHEET_NAME)) ss.insertSheet(MAIN_SHEET_NAME).appendRow(reportHeaders);
  if (!ss.getSheetByName(DELETED_SHEET_NAME)) ss.insertSheet(DELETED_SHEET_NAME).appendRow(reportHeaders);
  if (!ss.getSheetByName(PTP_SHEET_NAME)) ss.insertSheet(PTP_SHEET_NAME).appendRow(ptpHeaders);
  if (!ss.getSheetByName(DELETED_PTP_SHEET_NAME)) ss.insertSheet(DELETED_PTP_SHEET_NAME).appendRow(ptpHeaders);
  if (!ss.getSheetByName(AUDIT_LOG_SHEET_NAME)) ss.insertSheet(AUDIT_LOG_SHEET_NAME).appendRow(auditHeaders);
  if (!ss.getSheetByName(FOREMEN_SHEET_NAME)) {
    const fm = ss.insertSheet(FOREMEN_SHEET_NAME);
    fm.appendRow(foremanHeaders);
    fm.appendRow(["Admin", "1234"]);
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
