/**
 * Generates a fully styled, self-contained HTML string for printing a medical report.
 * This avoids the problem of Tailwind classes not being available in the print window.
 */
export function generatePrintHTML(data: {
    patientName: string;
    date: string;
    age: string;
    gender: string;
    vitalsBp: string;
    vitalsPulse: string;
    vitalsTemp: string;
    vitalsWeight: string;
    symptoms: string[];
    diagnosis: string;
    medications: { name: string; dosage: string; frequency: string; duration: string }[];
    advice: string;
    nextVisit: string;
}, doctorName: string, doctorDept: string): string {
    const symptomsList = data.symptoms
        .filter(s => s.trim())
        .map(s => `<li>${s}</li>`)
        .join("");

    const medsList = data.medications
        .filter(m => m.name.trim())
        .map((m, i) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:11pt;color:#1e293b;">${i + 1}. ${m.name}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:10pt;color:#64748b;">${m.dosage}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:10pt;color:#64748b;">${m.frequency}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:10pt;color:#64748b;">${m.duration}</td>
      </tr>
    `)
        .join("");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Medical Report — ${data.patientName}</title>
  <style>
    @page { size: A4; margin: 15mm 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      max-width: 700px;
      margin: 0 auto;
      padding: 30px 0;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #0284c7;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 22pt;
      color: #0284c7;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header .doctor {
      font-size: 12pt;
      font-weight: 600;
      color: #334155;
      margin-top: 4px;
    }
    .header .dept {
      font-size: 10pt;
      color: #64748b;
    }
    .patient-info {
      display: flex;
      justify-content: space-between;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      background: #f8fafc;
    }
    .patient-info .item label {
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      font-weight: 600;
    }
    .patient-info .item .value {
      font-size: 11pt;
      font-weight: 600;
      color: #1e293b;
      display: block;
      margin-top: 2px;
    }
    .vitals {
      display: flex;
      gap: 24px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 10px 16px;
      margin-bottom: 20px;
      font-size: 10pt;
    }
    .vitals span { color: #334155; }
    .vitals b { color: #1e40af; }
    .body-grid {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 24px;
      margin-bottom: 24px;
      min-height: 180px;
    }
    .sidebar {
      border-right: 2px solid #e2e8f0;
      padding-right: 20px;
    }
    .section-title {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #0284c7;
      margin-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .symptom-list {
      list-style: disc;
      padding-left: 18px;
      font-size: 10pt;
      color: #334155;
    }
    .symptom-list li { margin-bottom: 4px; }
    .diagnosis {
      font-size: 10pt;
      color: #334155;
      white-space: pre-wrap;
      margin-top: 16px;
    }
    .med-table {
      width: 100%;
      border-collapse: collapse;
    }
    .med-table th {
      text-align: left;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      padding: 6px 8px;
      border-bottom: 2px solid #e2e8f0;
      font-weight: 600;
    }
    .footer {
      border-top: 2px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .advice-section { max-width: 400px; }
    .advice-section h4 {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #0284c7;
      margin-bottom: 6px;
    }
    .advice-section p {
      font-size: 10pt;
      color: #334155;
      white-space: pre-wrap;
    }
    .next-visit {
      font-size: 10pt;
      font-weight: 600;
      color: #1e293b;
      margin-top: 10px;
    }
    .signature {
      text-align: center;
    }
    .signature .line {
      width: 140px;
      border-bottom: 1px solid #94a3b8;
      margin-bottom: 4px;
    }
    .signature .label {
      font-size: 9pt;
      font-weight: 600;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>MediFlow</h1>
      <div class="doctor">${doctorName}</div>
      <div class="dept">${doctorDept}</div>
    </div>

    <div class="patient-info">
      <div class="item">
        <label>Patient Name</label>
        <span class="value">${data.patientName}</span>
      </div>
      <div class="item">
        <label>Date</label>
        <span class="value">${data.date}</span>
      </div>
      <div class="item">
        <label>Age / Sex</label>
        <span class="value">${data.age}${data.gender ? ` / ${data.gender}` : ""}</span>
      </div>
    </div>

    <div class="vitals">
      <span><b>BP:</b> ${data.vitalsBp || "—"}</span>
      <span><b>Pulse:</b> ${data.vitalsPulse || "—"}</span>
      <span><b>Temp:</b> ${data.vitalsTemp || "—"}</span>
      <span><b>Wt/Ht:</b> ${data.vitalsWeight || "—"}</span>
    </div>

    <div class="body-grid">
      <div class="sidebar">
        <div class="section-title">Symptoms</div>
        <ul class="symptom-list">${symptomsList || "<li>—</li>"}</ul>
        <div class="diagnosis">
          <div class="section-title" style="margin-top:16px;">Diagnosis</div>
          ${data.diagnosis || "—"}
        </div>
      </div>

      <div>
        <div class="section-title">Medications (Rx)</div>
        ${medsList ? `
        <table class="med-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>${medsList}</tbody>
        </table>` : "<p style='font-size:10pt;color:#94a3b8;'>No medications prescribed</p>"}
      </div>
    </div>

    <div class="footer">
      <div class="advice-section">
        ${data.advice ? `<h4>Advice / Instructions</h4><p>${data.advice}</p>` : ""}
        ${data.nextVisit ? `<div class="next-visit">Next Visit: ${data.nextVisit}</div>` : ""}
      </div>
      <div class="signature">
        <div class="line"></div>
        <div class="label">Doctor's Signature</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
