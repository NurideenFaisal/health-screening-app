import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, User } from "lucide-react";
import Section1 from "../../components/ScreeningSection1";
import Section2 from "../../components/ScreeningSection2";
import Section3 from "../../components/ScreeningSection3";

export default function ScreeningForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("section1");

  // Demo patients data
  const patients = [
    { id: 'GH0987-001', name: 'Kwame Mensah', gender: 'Male', age: 6, dateOfBirth: '2018-03-15', guardian: 'Abena Mensah', contact: '+233 24 123 4567' },
    { id: 'GH0987-002', name: 'Ama Asante', gender: 'Female', age: 5, dateOfBirth: '2019-07-22', guardian: 'Kwaku Asante', contact: '+233 24 234 5678' },
    { id: 'GH0987-003', name: 'Kofi Owusu', gender: 'Male', age: 4, dateOfBirth: '2020-01-10', guardian: 'Efua Owusu', contact: '+233 24 345 6789' },
    { id: 'GH0987-004', name: 'Akua Boateng', gender: 'Female', age: 7, dateOfBirth: '2017-11-05', guardian: 'Yaw Boateng', contact: '+233 24 456 7890' },
    { id: 'GH0987-005', name: 'Yaw Osei', gender: 'Male', age: 6, dateOfBirth: '2018-09-18', guardian: 'Ama Osei', contact: '+233 24 567 8901' },
  ];

  const patient = patients.find(p => p.id === id);

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Patient not found</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Sticky Header - Compact Patient Info with Back Button */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          
          {/* Left: Back Button + Compact Patient Info */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition flex items-center gap-1"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Back</span>
            </button>
            
            <div className="h-6 w-px bg-gray-300"></div>
            
            {/* Compact Patient Info with Hover Card */}
            <div className="relative group">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold">
                  {patient.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{patient.name}</p>
                  <p className="text-xs text-gray-500">{patient.id}</p>
                </div>
                <User size={14} className="text-gray-400 ml-1" />
              </div>

              {/* Hover Card - Full Patient Details */}
              <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Patient Information</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500 mb-0.5">Full Name</p>
                    <p className="font-medium text-gray-900">{patient.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Child ID</p>
                    <p className="font-medium text-gray-900">{patient.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Age</p>
                    <p className="font-medium text-gray-900">{patient.age} years</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Gender</p>
                    <p className="font-medium text-gray-900">{patient.gender}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Date of Birth</p>
                    <p className="font-medium text-gray-900">{patient.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Status</p>
                    <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                      In Progress
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 mb-0.5">Guardian</p>
                    <p className="font-medium text-gray-900">{patient.guardian}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 mb-0.5">Contact</p>
                    <p className="font-medium text-gray-900">{patient.contact}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Status Badge */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
              In Progress
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200">
          <TabButton
            label="Vital & Examination"
            isActive={activeTab === "section1"}
            onClick={() => setActiveTab("section1")}
          />
          <TabButton
            label="Laboratory"
            isActive={activeTab === "section2"}
            onClick={() => setActiveTab("section2")}
          />
          <TabButton
            label="Summary & Diagnosis"
            isActive={activeTab === "section3"}
            onClick={() => setActiveTab("section3")}
          />
        </div>
      </div>

      {/* Section Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto bg-white shadow rounded-xl p-6">
          {activeTab === "section1" && <Section1 patientId={id} patient={patient} />}
          {activeTab === "section2" && <Section2 patientId={id} patient={patient} />}
          {activeTab === "section3" && <Section3 patientId={id} patient={patient} />}
        </div>
      </div>
    </div>
  );
}

/* Tab Button Component */
function TabButton({ label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-medium border-b-2 transition flex-1
        ${
          isActive
            ? "border-emerald-600 text-emerald-600 bg-emerald-50/30"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
        }`}
    >
      {label}
    </button>
  );
}