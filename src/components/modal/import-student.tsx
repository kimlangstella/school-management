import React, { useState } from "react";
import Papa from "papaparse";

interface Student {
  [key: string]: string;
}

const ImportStudentUploader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [columns, setColumns] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as Student[];
        setStudents(parsedData);
        setColumns(Object.keys(parsedData[0] || {}));
      },
    });
  };

  const handleInputChange = (
    index: number,
    column: string,
    value: string
  ) => {
    const updated = [...students];
    updated[index][column] = value;
    setStudents(updated);
  };

  const handleImport = async () => {
    try {
      const response = await fetch("/api/import-students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(students),
      });

      if (response.ok) {
        alert("✅ Students imported successfully!");
        setStudents([]);
        setColumns([]);
        setIsOpen(false);
      } else {
        alert("❌ Import failed.");
      }
    } catch (error) {
      console.error("Import error:", error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        📥 Import Students
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-6xl p-6 space-y-4 overflow-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">📋 Import Students</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✖
              </button>
            </div>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />

            {students.length > 0 && columns.length > 0 && (
              <div className="overflow-auto max-h-[400px] border rounded shadow">
                <table className="min-w-full text-sm text-left border-collapse">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-2 border font-semibold text-gray-800 bg-gray-100"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {columns.map((col) => (
                          <td key={col} className="px-4 py-2 border">
                            <input
                              type="text"
                              value={student[col] || ""}
                              onChange={(e) =>
                                handleInputChange(index, col, e.target.value)
                              }
                              className="w-full px-2 py-1 text-sm border rounded"
                              placeholder={`Enter ${col}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {students.length > 0 && (
              <button
                onClick={handleImport}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                ➕ Add Students
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImportStudentUploader;
