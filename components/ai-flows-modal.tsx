"use client"

import { useState, useEffect } from "react"
import { Bot, Upload, RotateCcw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ScoreCardData, Pillar, Category, StrategicGoal, StrategicProgram } from "@/types/scorecard"

type AIFlowType = "goal-comparison" | "learnings-best-practices"

interface FilterSelections {
  pillars: string[]
  categories: string[]
  goals: string[]
  programs: string[]
}

interface AIFlowsModalProps {
  isOpen: boolean
  onClose: () => void
  flowType: AIFlowType
  scorecardData: ScoreCardData
  onGenerate: (prompt: string, files: File[], flowType: AIFlowType, selections: FilterSelections) => void
}

export function AIFlowsModal({ isOpen, onClose, flowType, scorecardData, onGenerate }: AIFlowsModalProps) {
  const [prompt, setPrompt] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [searchTerms, setSearchTerms] = useState({
    pillars: "",
    categories: "",
    goals: "",
    programs: ""
  })
  
  // Selection states - start with all selected
  const [selections, setSelections] = useState<FilterSelections>({
    pillars: [],
    categories: [],
    goals: [],
    programs: []
  })

  // Initialize selections when modal opens or data changes
  useEffect(() => {
    if (isOpen && scorecardData && scorecardData.pillars) {
      const allPillarIds = scorecardData.pillars.map(p => p.id)
      const allCategoryIds = scorecardData.pillars.flatMap(p => 
        (p.categories || []).map(c => c.id)
      )
      const allGoalIds = scorecardData.pillars.flatMap(p => 
        (p.categories || []).flatMap(c => 
          (c.strategicGoals || []).map(g => g.id)
        )
      )
      const allProgramIds = scorecardData.pillars.flatMap(p => 
        (p.categories || []).flatMap(c => 
          (c.strategicGoals || []).flatMap(g => 
            (g.strategicPrograms || []).map(prog => prog.id)
          )
        )
      )
      
      setSelections({
        pillars: allPillarIds,
        categories: allCategoryIds,
        goals: allGoalIds,
        programs: allProgramIds
      })
    }
  }, [isOpen, scorecardData])

  const getFilteredData = () => {
    if (!scorecardData || !scorecardData.pillars) return { pillars: [], categories: [], goals: [], programs: [] }

    // Filter pillars
    const filteredPillars = scorecardData.pillars.filter(p => 
      selections.pillars.includes(p.id) &&
      (searchTerms.pillars === "" || p.name.toLowerCase().includes(searchTerms.pillars.toLowerCase()))
    )

    // Filter categories based on selected pillars
    const filteredCategories = filteredPillars.flatMap(p => 
      (p.categories || []).filter(c => 
        selections.categories.includes(c.id) &&
        (searchTerms.categories === "" || c.name.toLowerCase().includes(searchTerms.categories.toLowerCase()))
      )
    )

    // Filter goals based on selected categories
    const filteredGoals = filteredCategories.flatMap(c => 
      (c.strategicGoals || []).filter(g => 
        selections.goals.includes(g.id) &&
        (searchTerms.goals === "" || g.text.toLowerCase().includes(searchTerms.goals.toLowerCase()))
      )
    )

    // Filter programs based on selected goals
    const filteredPrograms = filteredGoals.flatMap(g => 
      (g.strategicPrograms || []).filter(p => 
        selections.programs.includes(p.id) &&
        (searchTerms.programs === "" || p.text.toLowerCase().includes(searchTerms.programs.toLowerCase()))
      )
    )

    return { pillars: filteredPillars, categories: filteredCategories, goals: filteredGoals, programs: filteredPrograms }
  }

  const handlePillarToggle = (pillarId: string, checked: boolean) => {
    const pillar = scorecardData?.pillars?.find(p => p.id === pillarId)
    if (!pillar) return

    if (checked) {
      // Add pillar and all its children
      const categoryIds = (pillar.categories || []).map(c => c.id)
      const goalIds = (pillar.categories || []).flatMap(c => 
        (c.strategicGoals || []).map(g => g.id)
      )
      const programIds = (pillar.categories || []).flatMap(c => 
        (c.strategicGoals || []).flatMap(g => 
          (g.strategicPrograms || []).map(p => p.id)
        )
      )

      setSelections(prev => ({
        pillars: [...prev.pillars, pillarId],
        categories: [...new Set([...prev.categories, ...categoryIds])],
        goals: [...new Set([...prev.goals, ...goalIds])],
        programs: [...new Set([...prev.programs, ...programIds])]
      }))
    } else {
      // Remove pillar and all its children
      const categoryIds = (pillar.categories || []).map(c => c.id)
      const goalIds = (pillar.categories || []).flatMap(c => 
        (c.strategicGoals || []).map(g => g.id)
      )
      const programIds = (pillar.categories || []).flatMap(c => 
        (c.strategicGoals || []).flatMap(g => 
          (g.strategicPrograms || []).map(p => p.id)
        )
      )

      setSelections(prev => ({
        pillars: prev.pillars.filter(id => id !== pillarId),
        categories: prev.categories.filter(id => !categoryIds.includes(id)),
        goals: prev.goals.filter(id => !goalIds.includes(id)),
        programs: prev.programs.filter(id => !programIds.includes(id))
      }))
    }
  }

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    const category = (scorecardData?.pillars || []).flatMap(p => 
      (p.categories || [])
    ).find(c => c.id === categoryId)
    if (!category) return

    if (checked) {
      // Add category and all its children
      const goalIds = (category.strategicGoals || []).map(g => g.id)
      const programIds = (category.strategicGoals || []).flatMap(g => 
        (g.strategicPrograms || []).map(p => p.id)
      )

      setSelections(prev => ({
        ...prev,
        categories: [...prev.categories, categoryId],
        goals: [...new Set([...prev.goals, ...goalIds])],
        programs: [...new Set([...prev.programs, ...programIds])]
      }))
    } else {
      // Remove category and all its children
      const goalIds = (category.strategicGoals || []).map(g => g.id)
      const programIds = (category.strategicGoals || []).flatMap(g => 
        (g.strategicPrograms || []).map(p => p.id)
      )

      setSelections(prev => ({
        ...prev,
        categories: prev.categories.filter(id => id !== categoryId),
        goals: prev.goals.filter(id => !goalIds.includes(id)),
        programs: prev.programs.filter(id => !programIds.includes(id))
      }))
    }
  }

  const handleGoalToggle = (goalId: string, checked: boolean) => {
    const goal = (scorecardData?.pillars || []).flatMap(p => 
      (p.categories || []).flatMap(c => (c.strategicGoals || []))
    ).find(g => g.id === goalId)
    if (!goal) return

    if (checked) {
      // Add goal and all its children
      const programIds = (goal.strategicPrograms || []).map(p => p.id)

      setSelections(prev => ({
        ...prev,
        goals: [...prev.goals, goalId],
        programs: [...new Set([...prev.programs, ...programIds])]
      }))
    } else {
      // Remove goal and all its children
      const programIds = (goal.strategicPrograms || []).map(p => p.id)

      setSelections(prev => ({
        ...prev,
        goals: prev.goals.filter(id => id !== goalId),
        programs: prev.programs.filter(id => !programIds.includes(id))
      }))
    }
  }

  const handleProgramToggle = (programId: string, checked: boolean) => {
    if (checked) {
      setSelections(prev => ({
        ...prev,
        programs: [...prev.programs, programId]
      }))
    } else {
      setSelections(prev => ({
        ...prev,
        programs: prev.programs.filter(id => id !== programId)
      }))
    }
  }

  const handleSelectAllPillars = (checked: boolean) => {
    if (checked) {
      const allPillarIds = (scorecardData?.pillars || []).map(p => p.id)
      const allCategoryIds = (scorecardData?.pillars || []).flatMap(p => 
        (p.categories || []).map(c => c.id)
      )
      const allGoalIds = (scorecardData?.pillars || []).flatMap(p => 
        (p.categories || []).flatMap(c => 
          (c.strategicGoals || []).map(g => g.id)
        )
      )
      const allProgramIds = (scorecardData?.pillars || []).flatMap(p => 
        (p.categories || []).flatMap(c => 
          (c.strategicGoals || []).flatMap(g => 
            (g.strategicPrograms || []).map(prog => prog.id)
          )
        )
      )
      
      setSelections({
        pillars: allPillarIds,
        categories: allCategoryIds,
        goals: allGoalIds,
        programs: allProgramIds
      })
    } else {
      setSelections({
        pillars: [],
        categories: [],
        goals: [],
        programs: []
      })
    }
  }

  const resetFilters = () => {
    const allPillarIds = (scorecardData?.pillars || []).map(p => p.id)
    const allCategoryIds = (scorecardData?.pillars || []).flatMap(p => 
      (p.categories || []).map(c => c.id)
    )
    const allGoalIds = (scorecardData?.pillars || []).flatMap(p => 
      (p.categories || []).flatMap(c => 
        (c.strategicGoals || []).map(g => g.id)
      )
    )
    const allProgramIds = (scorecardData?.pillars || []).flatMap(p => 
      (p.categories || []).flatMap(c => 
        (c.strategicGoals || []).flatMap(g => 
          (g.strategicPrograms || []).map(prog => prog.id)
        )
      )
    )
    
    setSelections({
      pillars: allPillarIds,
      categories: allCategoryIds,
      goals: allGoalIds,
      programs: allProgramIds
    })
    
    setSearchTerms({
      pillars: "",
      categories: "",
      goals: "",
      programs: ""
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleGenerate = () => {
    onGenerate(prompt, files, flowType, selections)
    onClose()
  }

  const handleClose = () => {
    setPrompt("")
    setFiles([])
    resetFilters()
    onClose()
  }

  const getTitle = () => {
    return flowType === "goal-comparison" ? "Goal Comparison" : "Learnings/Best Practices"
  }

  const getDescription = () => {
    return flowType === "goal-comparison" 
      ? "Compare selected goals for similarities and differences across your organization."
      : "Extract learnings and best practices from selected strategic initiatives."
  }

  const filteredData = getFilteredData()
  const allPillarsSelected = (scorecardData?.pillars?.length || 0) > 0 && 
    selections.pillars.length === (scorecardData?.pillars?.length || 0)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Hierarchical Filters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Filter Selection</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFilters}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filters
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                📝 Responses will open in the AI Chat thread, resetting any open thread
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Strategic Pillars */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Strategic Pillars</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all-pillars"
                      checked={allPillarsSelected}
                      onCheckedChange={handleSelectAllPillars}
                    />
                    <Label htmlFor="select-all-pillars" className="text-xs">Select All</Label>
                  </div>
                </div>
                <Input
                  placeholder="Search pillars..."
                  value={searchTerms.pillars}
                  onChange={(e) => setSearchTerms(prev => ({ ...prev, pillars: e.target.value }))}
                  className="text-sm"
                />
                <div className="max-h-32 overflow-y-auto space-y-1 border rounded p-2">
                  {scorecardData?.pillars
                    ?.filter(p => searchTerms.pillars === "" || 
                      p.name.toLowerCase().includes(searchTerms.pillars.toLowerCase()))
                    ?.map(pillar => (
                    <div key={pillar.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`pillar-${pillar.id}`}
                        checked={selections.pillars.includes(pillar.id)}
                        onCheckedChange={(checked) => handlePillarToggle(pillar.id, checked as boolean)}
                      />
                      <Label htmlFor={`pillar-${pillar.id}`} className="text-xs flex-1 cursor-pointer">
                        {pillar.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Categories</Label>
                <Input
                  placeholder="Search categories..."
                  value={searchTerms.categories}
                  onChange={(e) => setSearchTerms(prev => ({ ...prev, categories: e.target.value }))}
                  className="text-sm"
                />
                <div className="max-h-32 overflow-y-auto space-y-1 border rounded p-2">
                  {filteredData.categories.map(category => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selections.categories.includes(category.id)}
                        onCheckedChange={(checked) => handleCategoryToggle(category.id, checked as boolean)}
                      />
                      <Label htmlFor={`category-${category.id}`} className="text-xs flex-1 cursor-pointer">
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategic Goals */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Strategic Goals</Label>
                <Input
                  placeholder="Search goals..."
                  value={searchTerms.goals}
                  onChange={(e) => setSearchTerms(prev => ({ ...prev, goals: e.target.value }))}
                  className="text-sm"
                />
                <div className="max-h-32 overflow-y-auto space-y-1 border rounded p-2">
                  {filteredData.goals.map(goal => (
                    <div key={goal.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`goal-${goal.id}`}
                        checked={selections.goals.includes(goal.id)}
                        onCheckedChange={(checked) => handleGoalToggle(goal.id, checked as boolean)}
                      />
                      <Label htmlFor={`goal-${goal.id}`} className="text-xs flex-1 cursor-pointer">
                        {goal.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategic Programs */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Strategic Programs</Label>
                <Input
                  placeholder="Search programs..."
                  value={searchTerms.programs}
                  onChange={(e) => setSearchTerms(prev => ({ ...prev, programs: e.target.value }))}
                  className="text-sm"
                />
                <div className="max-h-32 overflow-y-auto space-y-1 border rounded p-2">
                  {filteredData.programs.map(program => (
                    <div key={program.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`program-${program.id}`}
                        checked={selections.programs.includes(program.id)}
                        onCheckedChange={(checked) => handleProgramToggle(program.id, checked as boolean)}
                      />
                      <Label htmlFor={`program-${program.id}`} className="text-xs flex-1 cursor-pointer">
                        {program.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <Label htmlFor="prompt" className="block text-sm font-medium mb-2">
              Additional Instructions
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter additional instructions for the analysis..."
              className="min-h-[100px]"
            />
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="file-upload" className="block text-sm font-medium mb-2">
              Attach Documents
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('ai-flows-file-upload')?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Choose Files
              </Button>
              <input
                id="ai-flows-file-upload"
                type="file"
                multiple
                accept=".ppt,.pptx,.doc,.docx,.pdf,.txt,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-gray-600">Attached files:</p>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Analyze
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}