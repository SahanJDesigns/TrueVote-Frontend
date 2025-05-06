"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface Candidate {
  id: string
  name: string
}

interface CandidateInputProps {
  candidate: Candidate
  index: number
  updateCandidate: (id: string, field: keyof Candidate, value: string) => void
  removeCandidate: (id: string) => void
  showRemoveButton: boolean
}

export function CandidateInput({
  candidate,
  index,
  updateCandidate,
  removeCandidate,
  showRemoveButton,
}: CandidateInputProps) {
  return (
    <div className="p-4 border border-slate-700 rounded-lg bg-slate-800/50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-medium">Candidate {index + 1}</h3>
        {showRemoveButton && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            onClick={() => removeCandidate(candidate.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="space-y-3">
        <div className="space-y-2"> 
          <Input
            id={`candidate-name-${candidate.id}`}
            value={candidate.name}
            onChange={(e) => updateCandidate(candidate.id, "name", e.target.value)}
            placeholder="Enter candidate name"
            className="bg-slate-900 border-slate-700 text-white"
          />
        </div>
      </div>
    </div>
  )
}
