import React from 'react';

export default function PrescriptionPreview({ data }) {
    return (
        <div className="a4-document" id="prescription-document">
            {/* Header */}
            <div className="doc-header">
                <div className="clinic-name">Mediflow</div>
                <div className="doctor-name">Dr. Alan Brookes, MD</div>
                <div className="clinic-contact">Cardiology | Reg No: 54321</div>
                <div className="clinic-contact">123 Health Avenue, Medical District | Ph: (555) 123-4567</div>
            </div>

            {/* Patient Info Block */}
            <div className="doc-patient-info">
                <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{data.patientName}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Date:</span>
                    <span className="info-value">{data.date}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Age/Sex:</span>
                    <span className="info-value">
                        {data.age && data.gender ? `${data.age} / ${data.gender}` : data.age || data.gender || ''}
                    </span>
                </div>
            </div>

            {/* Vitals Ribbon */}
            <div className="doc-vitals">
                <div className="vital-item"><strong>BP:</strong> {data.vitals.bp}</div>
                <div className="vital-item"><strong>Pulse:</strong> {data.vitals.pulse}</div>
                <div className="vital-item"><strong>Temp:</strong> {data.vitals.temp}</div>
                <div className="vital-item"><strong>Wt/Ht:</strong> {data.vitals.weight}</div>
            </div>

            {/* Main Content Area */}
            <div className="doc-body">
                {/* Left sidebar: Symptoms & Diagnosis */}
                <div className="doc-sidebar">
                    <div style={{ marginBottom: '1rem' }}>
                        <div className="doc-section-title" style={{ fontSize: '10pt' }}>Symptoms</div>
                        <ul className="symptom-list" style={{ fontSize: '10pt', paddingLeft: '1.2rem', minHeight: '50px' }}>
                            {data.symptoms.filter(s => s.trim() !== '').map((symptom, idx) => (
                                <li key={idx}>{symptom}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <div className="doc-section-title" style={{ fontSize: '10pt' }}>Diagnosis</div>
                        <p style={{ fontSize: '10pt', whiteSpace: 'pre-wrap', minHeight: '50px' }}>{data.diagnosis}</p>
                    </div>
                </div>

                {/* Right main area: Medications */}
                <div className="doc-main">
                    <div className="doc-section-title" style={{ fontSize: '10pt', marginBottom: '1rem' }}>Medications</div>

                    <ul className="medication-list">
                        {data.medications.filter(m => m.name.trim() !== '').map((med, idx) => (
                            <li key={idx} className="medication-item">
                                <div className="med-name">{idx + 1}. {med.name}</div>
                                <div className="med-details">
                                    {med.dosage && <span>{med.dosage}</span>}
                                    {med.frequency && <span> • {med.frequency}</span>}
                                    {med.duration && <span> • {med.duration}</span>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Footer Area */}
            <div className="doc-footer">
                <div>
                    <div style={{ marginBottom: '1rem', maxWidth: '400px' }}>
                        <div className="doc-section-title" style={{ fontSize: '10pt' }}>Advice / Instructions</div>
                        <p style={{ fontSize: '10pt', whiteSpace: 'pre-wrap', minHeight: '80px' }}>{data.advice}</p>
                    </div>
                    <div style={{ fontSize: '10pt', fontWeight: 600, minHeight: '20px' }}>
                        Next Visit: {data.nextVisit}
                    </div>
                </div>

                <div className="signature-area">
                    <div className="signature-line"></div>
                    <div style={{ fontWeight: 600, fontSize: '10pt' }}>Doctor's Signature</div>
                </div>
            </div>
        </div>
    );
}
