import React from 'react';
import { Plus, Trash2, Printer, Activity } from 'lucide-react';

export default function PrescriptionForm({ data, onChange }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  const handleVitalChange = (e) => {
    const { name, value } = e.target;
    onChange({
      ...data,
      vitals: { ...data.vitals, [name]: value }
    });
  };

  // Symptoms Methods
  const addSymptom = () => {
    onChange({
      ...data,
      symptoms: [...data.symptoms, '']
    });
  };

  const updateSymptom = (index, value) => {
    const newSymptoms = [...data.symptoms];
    newSymptoms[index] = value;
    onChange({ ...data, symptoms: newSymptoms });
  };

  const removeSymptom = (index) => {
    const newSymptoms = data.symptoms.filter((_, i) => i !== index);
    onChange({ ...data, symptoms: newSymptoms });
  };

  // Medications Methods
  const addMedication = () => {
    onChange({
      ...data,
      medications: [
        ...data.medications,
        { name: '', dosage: '', frequency: '', duration: '' }
      ]
    });
  };

  const updateMedication = (index, field, value) => {
    const newMeds = [...data.medications];
    newMeds[index][field] = value;
    onChange({ ...data, medications: newMeds });
  };

  const removeMedication = (index) => {
    const newMeds = data.medications.filter((_, i) => i !== index);
    onChange({ ...data, medications: newMeds });
  };

  return (
    <div className="form-content">
      <div className="form-group">
        <h3 className="section-title">Patient Information</h3>
        <div className="form-row">
          <div>
            <label>Patient Name</label>
            <input 
              type="text" 
              name="patientName"
              placeholder="e.g. John Doe"
              value={data.patientName}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Date</label>
            <input 
              type="date" 
              name="date"
              value={data.date}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label>Age</label>
            <input 
              type="text" 
              name="age"
              placeholder="e.g. 35 Y"
              value={data.age}
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Gender</label>
            <select name="gender" value={data.gender} onChange={handleChange}>
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-group">
        <h3 className="section-title">Vitals</h3>
        <div className="form-row">
          <div>
            <label>Blood Pressure</label>
            <input 
              type="text" 
              name="bp"
              placeholder="120/80 mmHg"
              value={data.vitals.bp}
              onChange={handleVitalChange}
            />
          </div>
          <div>
            <label>Pulse</label>
            <input 
              type="text" 
              name="pulse"
              placeholder="72 bpm"
              value={data.vitals.pulse}
              onChange={handleVitalChange}
            />
          </div>
        </div>
        <div className="form-row">
          <div>
            <label>Temperature</label>
            <input 
              type="text" 
              name="temp"
              placeholder="98.6 °F"
              value={data.vitals.temp}
              onChange={handleVitalChange}
            />
          </div>
          <div>
            <label>Weight / Height</label>
            <input 
              type="text" 
              name="weight"
              placeholder="70 kg / 175 cm"
              value={data.vitals.weight}
              onChange={handleVitalChange}
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <h3 className="section-title">Clinical Notes</h3>
        
        <label>Symptoms & Complaints</label>
        {data.symptoms.map((symptom, index) => (
          <div key={index} className="dynamic-list-item">
            <div className="form-row">
              <input 
                type="text" 
                placeholder="e.g. Fever for 3 days"
                value={symptom}
                onChange={(e) => updateSymptom(index, e.target.value)}
              />
            </div>
            <button 
              className="btn-icon danger" 
              onClick={() => removeSymptom(index)}
              title="Remove symptom"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        <button className="btn btn-outline" onClick={addSymptom} style={{marginBottom: 'var(--spacing-md)'}}>
          <Plus size={16} /> Add Symptom
        </button>

        <label style={{marginTop: 'var(--spacing-md)'}}>Diagnosis</label>
        <textarea 
          name="diagnosis"
          placeholder="Enter diagnosis notes..."
          value={data.diagnosis}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <h3 className="section-title">Medications (Rx)</h3>
        {data.medications.map((med, index) => (
          <div key={index} className="dynamic-list-item" style={{ border: '1px solid var(--border-color)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', flexWrap: 'wrap' }}>
            <div style={{ width: '100%' }}>
               <div className="form-row">
                <div style={{ flex: 2 }}>
                  <label>Medicine Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Paracetamol 500mg"
                    value={med.name}
                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                  />
                </div>
                <div>
                   <label>Dosage</label>
                   <input 
                    type="text" 
                    placeholder="e.g. 1 Tablet"
                    value={med.dosage}
                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-row" style={{ marginTop: 'var(--spacing-sm)' }}>
                <div>
                  <label>Frequency</label>
                  <select 
                    value={med.frequency}
                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                  >
                    <option value="">Select...</option>
                    <option value="1-0-0 (Morning)">1-0-0 (Morning)</option>
                    <option value="1-0-1 (Morning/Night)">1-0-1 (Morning/Night)</option>
                    <option value="1-1-1 (Three times a day)">1-1-1 (Three times a day)</option>
                    <option value="0-0-1 (Bedtime)">0-0-1 (Bedtime)</option>
                    <option value="SOS (As needed)">SOS (As needed)</option>
                  </select>
                </div>
                <div>
                  <label>Duration</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 5 days, After food"
                    value={med.duration}
                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <button 
              className="btn btn-outline" 
              onClick={() => removeMedication(index)}
              style={{ borderColor: '#ef4444', color: '#ef4444', marginTop: 'var(--spacing-sm)' }}
            >
              <Trash2 size={16} /> Remove
            </button>
          </div>
        ))}
        <button className="btn btn-secondary" onClick={addMedication} style={{ marginTop: 'var(--spacing-sm)'}}>
          <Plus size={16} /> Add Medication
        </button>
      </div>

      <div className="form-group">
        <h3 className="section-title">Additional Advice</h3>
        <textarea 
          name="advice"
          placeholder="General advice, diet instructions..."
          value={data.advice}
          onChange={handleChange}
        />

        <div className="form-row" style={{ marginTop: 'var(--spacing-md)' }}>
           <div>
            <label>Next Visit</label>
            <input 
              type="text" 
              name="nextVisit"
              placeholder="e.g. After 1 Week or 15-May-2026"
              value={data.nextVisit}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
