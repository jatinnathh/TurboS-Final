import { useState } from "react";
import PrescriptionForm from "./components/PrescriptionForm";
import PrescriptionPreview from "./components/PrescriptionPreview";
import "./index.css";

export default function App() {
  const [data, setData] = useState({
    patientName: "Rishi",
    age: 27,
    diagnosis: "Rabies and std",
    bp: "120/80 mmHg",
    pulse: "72 bpm",
    temp: "98.6 F",
    weightHeight: "70kg / 175cm"
  });

  return (
    <div className="doctor-container">
      <div className="form-section">
        <PrescriptionForm data={data} setData={setData} />
      </div>

      <div className="preview-section">
        <PrescriptionPreview data={data} />
      </div>
    </div>
  );
}