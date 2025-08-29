"use client"

import { useState, useEffect } from "react"
import { Bot, Upload, ChevronRight, ChevronDown } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ScoreCardData, Pillar, Category, StrategicGoal } from "@/types/scorecard"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
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
  (c.goals || []).map(g => g.id)
        )
      )
      const allProgramIds = scorecardData.pillars.flatMap(p => 
        (p.categories || []).flatMap(c => 
  (c.goals || []).flatMap(g => 
  (g.programs || []).map(prog => prog.id)
          )
        )
      )
      
      setSelections({
        pillars: allPillarIds,
        categories: allCategoryIds,
        goals: allGoalIds,
        programs: allProgramIds
      })
      
      // Initialize with pillars expanded so users can see categories immediately
      const initialExpandedNodes = new Set(allPillarIds)
      setExpandedNodes(initialExpandedNodes)
    }
  }, [isOpen, scorecardData])

  const matchesSearch = (text: string) => {
    return searchTerm === "" || text.toLowerCase().includes(searchTerm.toLowerCase())
  }

  const getFilteredPillars = () => {
    if (!scorecardData || !scorecardData.pillars) return []
    
    // Auto-expand nodes that have matching children when searching
    if (searchTerm) {
      const nodesToExpand = new Set(expandedNodes)
      
      scorecardData.pillars.forEach(pillar => {
        pillar.categories?.forEach(category => {
          // Expand category if it has matching goals or programs
const hasMatchingGoals = category.goals?.some(goal => 
            matchesSearch(goal.text) || 
goal.programs?.some(prog => matchesSearch(prog.text))
          )
          if (hasMatchingGoals) {
            nodesToExpand.add(pillar.id) // Expand pillar
            nodesToExpand.add(category.id) // Expand category
          }
          
          // Expand goal if it has matching programs
category.goals?.forEach(goal => {
if (goal.programs?.some(prog => matchesSearch(prog.text))) {
              nodesToExpand.add(pillar.id) // Expand pillar
              nodesToExpand.add(category.id) // Expand category
              nodesToExpand.add(goal.id) // Expand goal
            }
          })
        })
      })
      
      // Update expanded nodes if new nodes need to be expanded
      if (nodesToExpand.size !== expandedNodes.size) {
        setExpandedNodes(nodesToExpand)
      }
    }
    
    return scorecardData.pillars.filter(pillar => {
      const pillarMatches = matchesSearch(pillar.name)
      const categoryMatches = (pillar.categories || []).some(cat => 
        matchesSearch(cat.name) || 
(cat.goals || []).some(goal => 
          matchesSearch(goal.text) || 
(goal.programs || []).some(prog => matchesSearch(prog.text))
        )
      )
      return pillarMatches || categoryMatches
    })
  }

  const getTotalProgramCount = () => {
    if (!scorecardData || !scorecardData.pillars) return 0
    return scorecardData.pillars.reduce((total, pillar) => {
      return total + (pillar.categories || []).reduce((catTotal, category) => {
        return catTotal + (category.strategicGoals || []).reduce((goalTotal, goal) => {
          return goalTotal + (goal.strategicPrograms || []).length
        }, 0)
      }, 0)
    }, 0)
  }

  const getSelectedProgramCount = () => {
    return selections.programs.length
  }

  const handlePillarToggle = (pillarId: string, checked: boolean) => {
    const pillar = scorecardData?.pillars?.find(p => p.id === pillarId)
    if (!pillar) return

    if (checked) {
      // Add pillar and all its children
      const categoryIds = (pillar.categories || []).map(c => c.id)
      const goalIds = (pillar.categories || []).flatMap(c => 
(c.goals || []).map(g => g.id)
      )
      const programIds = (pillar.categories || []).flatMap(c => 
(c.goals || []).flatMap(g => 
(g.programs || []).map(p => p.id)
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
(c.goals || []).map(g => g.id)
      )
      const programIds = (pillar.categories || []).flatMap(c => 
(c.goals || []).flatMap(g => 
(g.programs || []).map(p => p.id)
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
const goalIds = (category.goals || []).map(g => g.id)
const programIds = (category.goals || []).flatMap(g => 
(g.programs || []).map(p => p.id)
      )

      setSelections(prev => ({
        ...prev,
        categories: [...prev.categories, categoryId],
        goals: [...new Set([...prev.goals, ...goalIds])],
        programs: [...new Set([...prev.programs, ...programIds])]
      }))
    } else {
      // Remove category and all its children
const goalIds = (category.goals || []).map(g => g.id)
const programIds = (category.goals || []).flatMap(g => 
(g.programs || []).map(p => p.id)
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
(p.categories || []).flatMap(c => (c.goals || []))
).find(g => g.id === goalId)
    if (!goal) return

    if (checked) {
      // Add goal and all its children
const programIds = (goal.programs || []).map(p => p.id)

      setSelections(prev => ({
        ...prev,
        goals: [...prev.goals, goalId],
        programs: [...new Set([...prev.programs, ...programIds])]
      }))
    } else {
      // Remove goal and all its children
const programIds = (goal.programs || []).map(p => p.id)

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


  const resetFilters = () => {
    const allPillarIds = (scorecardData?.pillars || []).map(p => p.id)
    const allCategoryIds = (scorecardData?.pillars || []).flatMap(p => 
      (p.categories || []).map(c => c.id)
    )
    const allGoalIds = (scorecardData?.pillars || []).flatMap(p => 
      (p.categories || []).flatMap(c => 
(c.goals || []).map(g => g.id)
      )
    )
    const allProgramIds = (scorecardData?.pillars || []).flatMap(p => 
      (p.categories || []).flatMap(c => 
(c.goals || []).flatMap(g => 
(g.programs || []).map(prog => prog.id)
        )
      )
    )
    
    setSelections({
      pillars: allPillarIds,
      categories: allCategoryIds,
      goals: allGoalIds,
      programs: allProgramIds
    })
    
    setSearchTerm("")
  }

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const expandAll = () => {
    const allNodeIds = new Set<string>()
    scorecardData?.pillars?.forEach(pillar => {
      allNodeIds.add(pillar.id)
      pillar.categories?.forEach(category => {
        allNodeIds.add(category.id)
        category.strategicGoals?.forEach(goal => {
          allNodeIds.add(goal.id)
        })
      })
    })
    setExpandedNodes(allNodeIds)
  }

  const collapseAll = () => {
    setExpandedNodes(new Set())
  }

  const getPillarCheckboxState = (pillar: Pillar) => {
    // Check if pillar itself is selected
    const isPillarSelected = selections.pillars.includes(pillar.id)
    
    if (!isPillarSelected) return false
    
    // If pillar is selected, check children state
    const allCategoryIds = pillar.categories.map(c => c.id)
    const allGoalIds = pillar.categories.flatMap(c => c.goals.map(g => g.id))
    const allProgramIds = pillar.categories.flatMap(c => c.goals.flatMap(g => g.programs?.map(p => p.id) || []))
    
    const selectedCategories = allCategoryIds.filter(id => selections.categories.includes(id))
    const selectedGoals = allGoalIds.filter(id => selections.goals.includes(id))
    const selectedPrograms = allProgramIds.filter(id => selections.programs.includes(id))
    
    const totalChildren = allCategoryIds.length + allGoalIds.length + allProgramIds.length
    const selectedChildren = selectedCategories.length + selectedGoals.length + selectedPrograms.length
    
    if (totalChildren === 0) return true // No children
    if (selectedChildren === totalChildren) return true
    if (selectedChildren > 0) return "indeterminate"
    return false
  }

  const getCategoryCheckboxState = (category: Category) => {
    // Check if category itself is selected
    const isCategorySelected = selections.categories.includes(category.id)
    
    if (!isCategorySelected) return false
    
    // If category is selected, check children state
    const allGoalIds = category.goals.map(g => g.id)
    const allProgramIds = category.goals.flatMap(g => g.programs?.map(p => p.id) || [])
    
    const selectedGoals = allGoalIds.filter(id => selections.goals.includes(id))
    const selectedPrograms = allProgramIds.filter(id => selections.programs.includes(id))
    
    const totalChildren = allGoalIds.length + allProgramIds.length
    const selectedChildren = selectedGoals.length + selectedPrograms.length
    
    if (totalChildren === 0) return true // No children
    if (selectedChildren === totalChildren) return true
    if (selectedChildren > 0) return "indeterminate"
    return false
  }

  const getGoalCheckboxState = (goal: StrategicGoal) => {
    // Check if goal itself is selected
    const isGoalSelected = selections.goals.includes(goal.id)
    
    if (!isGoalSelected) return false
    
    // If goal is selected, check children state
    const allPrograms = goal.programs || []
    const selectedPrograms = allPrograms.filter(p => selections.programs.includes(p.id))
    
    if (allPrograms.length === 0) return true // No children
    if (selectedPrograms.length === allPrograms.length) return true
    if (selectedPrograms.length > 0) return "indeterminate"
    return false
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
    setSearchTerm("")
    setExpandedNodes(new Set())
    setIsDropdownOpen(false)
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

  const filteredPillars = getFilteredPillars()
  const totalPrograms = getTotalProgramCount()
  const selectedPrograms = getSelectedProgramCount()

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
          {/* Hierarchical Dropdown Filter */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Filter Selection</h3>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                📝 Responses will open in the AI Chat thread, resetting any open thread
              </p>
            </div>

            {/* Single Hierarchical Dropdown */}
            <div className="space-y-2">
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Select Context
                    <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[600px] max-h-[500px] overflow-y-auto p-4">
                  {/* Controls */}
                  <div className="space-y-3 mb-4">
                    {/* Search */}
                    <Input
                      placeholder="Search across all levels..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-sm"
                    />
                    
                    {/* Expand/Collapse All */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={expandAll}
                        className="flex-1 text-xs"
                      >
                        Expand All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={collapseAll}
                        className="flex-1 text-xs"
                      >
                        Collapse All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetFilters}
                        className="flex-1 text-xs"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>

                  {/* Hierarchical Tree */}
                  <div className="space-y-1">
                    {filteredPillars.map(pillar => {
                      const pillarExpanded = expandedNodes.has(pillar.id)
                      const pillarCategories = pillar.categories || []
                      // const pillarCategoryIds = pillarCategories.map(c => c.id)
                      
                      return (
                        <div key={pillar.id} className="space-y-1">
                          {/* Pillar */}
                          <div className="flex items-center space-x-2 py-1">
                            <button
                              onClick={() => toggleNode(pillar.id)}
                              className="p-0.5 hover:bg-gray-100 rounded"
                            >
                              {pillarCategories.length > 0 ? (
                                pillarExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )
                              ) : (
                                <div className="h-3 w-3" />
                              )}
                            </button>
                            <Checkbox
                              checked={getPillarCheckboxState(pillar)}
                              onCheckedChange={(checked) => handlePillarToggle(pillar.id, checked as boolean)}
                            />
                            <Label className="text-sm font-medium cursor-pointer flex-1">
                              {pillar.name}
                            </Label>
                          </div>
                          
                          {/* Categories */}
                          {pillarExpanded && pillarCategories.map(category => {
                            const categoryExpanded = expandedNodes.has(category.id)
                const categoryGoals = category.goals || []
                            // const categoryGoalIds = categoryGoals.map(g => g.id)
                            
                            return (
                              <div key={category.id} className="ml-6 space-y-1">
                                {/* Category */}
                                <div className="flex items-center space-x-2 py-1">
                                  <button
                                    onClick={() => toggleNode(category.id)}
                                    className="p-0.5 hover:bg-gray-100 rounded"
                                  >
                                    {categoryGoals.length > 0 ? (
                                      categoryExpanded ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )
                                    ) : (
                                      <div className="h-3 w-3" />
                                    )}
                                  </button>
                                  <Checkbox
                                    checked={getCategoryCheckboxState(category)}
                                    onCheckedChange={(checked) => handleCategoryToggle(category.id, checked as boolean)}
                                  />
                                  <Label className="text-sm cursor-pointer flex-1">
                                    {category.name}
                                  </Label>
                                </div>
                                
                                {/* Goals */}
                                {categoryExpanded && categoryGoals.map(goal => {
                                  const goalExpanded = expandedNodes.has(goal.id)
const goalPrograms = goal.programs || []
                                  
                                  return (
                                    <div key={goal.id} className="ml-6 space-y-1">
                                      {/* Goal */}
                                      <div className="flex items-center space-x-2 py-1">
                                        <button
                                          onClick={() => toggleNode(goal.id)}
                                          className="p-0.5 hover:bg-gray-100 rounded"
                                        >
                                          {goalPrograms.length > 0 ? (
                                            goalExpanded ? (
                                              <ChevronDown className="h-3 w-3" />
                                            ) : (
                                              <ChevronRight className="h-3 w-3" />
                                            )
                                          ) : (
                                            <div className="h-3 w-3" />
                                          )}
                                        </button>
                                        <Checkbox
                                          checked={getGoalCheckboxState(goal)}
                                          onCheckedChange={(checked) => handleGoalToggle(goal.id, checked as boolean)}
                                        />
                                        <Label className="text-xs cursor-pointer flex-1">
                                          {goal.text}
                                        </Label>
                                      </div>
                                      
                                      {/* Programs */}
                                      {goalExpanded && goalPrograms.map(program => (
                                        <div key={program.id} className="ml-6">
                                          <div className="flex items-center space-x-2 py-1">
                                            <div className="h-3 w-3" />
                                            <Checkbox
                                              checked={selections.programs.includes(program.id)}
                                              onCheckedChange={(checked) => handleProgramToggle(program.id, checked as boolean)}
                                            />
                                            <Label className="text-xs cursor-pointer flex-1">
                                              {program.text}
                                            </Label>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Selection Status */}
              <div className="text-sm text-gray-600">
                {selectedPrograms} of {totalPrograms} strategic programs selected
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