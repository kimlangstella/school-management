import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

type ExamCardProps = {
  name: string
  description: string
  examType: string
  totalMarks: number
  examDate: string
  programName: string
  branchName: string
  onEdit: () => void
  onDelete: () => void
}

export default function ExamCard({
  name,
  description,
  examType,
  totalMarks,
  examDate,
  programName,
  branchName,
  onEdit,
  onDelete,
}: ExamCardProps) {
  return (
    <div className="bg-white shadow-md rounded-lg p-5 border border-gray-200 hover:shadow-lg transition">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">{name}</h2>
      <p className="text-sm text-gray-500 mb-2">{description}</p>
      <div className="text-sm text-gray-700 space-y-1">
        <p><span className="font-medium">Type:</span> {examType}</p>
        <p><span className="font-medium">Marks:</span> {totalMarks}</p>
        <p><span className="font-medium">Date:</span> {new Date(examDate).toLocaleDateString()}</p>
        <p><span className="font-medium">Program:</span> {programName}</p>
        <p><span className="font-medium">Branch:</span> {branchName}</p>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <PencilIcon className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
        >
          <TrashIcon className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  )
}
