"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, X, Save, Trash2, FileText, Settings, Loader2 } from "lucide-react"
import { createBusinessType, updateBusinessType, deleteBusinessType } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import type { BusinessTypePrompt } from "@/lib/types"

// Ensure BusinessType has subcategories typed as Subcategory[]
interface Subcategory {
  name: string;
  prompt: BusinessTypePrompt[];
}

interface BusinessType {
  _id: string;
  name: string;
  description?: string;
  subcategories: Subcategory[];
  prompt: BusinessTypePrompt[];
  createdAt?: string;
}
import { useRouter } from "next/navigation"

interface BusinessTypeManagementProps {
  initialBusinessTypes: BusinessType[]
}

interface Subcategory {
  name: string;
  prompt: BusinessTypePrompt[];
}

export default function BusinessTypeManagement({ initialBusinessTypes }: BusinessTypeManagementProps) {
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>(initialBusinessTypes)
  const [selectedType, setSelectedType] = useState<BusinessType | null>(
    initialBusinessTypes.length > 0 ? initialBusinessTypes[0] : null,
  )
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  // Initialize form with safe defaults
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subcategories: [{
      name: "",
      prompt: [{
        content: "",
        version: 1,
        model: "gpt-4o" as "gpt-4" | "gpt-4o",
        active: true,
      }]
    }] as Subcategory[],
    prompt: [
      {
        content: "",
        version: 1,
        model: "gpt-4o" as "gpt-4" | "gpt-4o",
        active: true,
      },
    ] as BusinessTypePrompt[],
  })

  const { toast } = useToast()

  // Reset form to selected business type
  const resetForm = useCallback(() => {
    if (selectedType) {
      setFormData({
        name: selectedType.name || "",
        description: selectedType.description || "",
        subcategories: selectedType.subcategories?.length 
          ? selectedType.subcategories.map(sc => 
              typeof sc === "string"
                ? { name: sc, prompt: [{ content: "", version: 1, model: "gpt-4o", active: true }] }
                : {
                    name: sc.name,
                    prompt: sc.prompt?.length ? [...sc.prompt] : [{
                      content: "",
                      version: 1,
                      model: "gpt-4o",
                      active: true,
                    }]
                  }
            )
          : [{ name: "", prompt: [{ content: "", version: 1, model: "gpt-4o", active: true }] }],
        prompt: selectedType.prompt?.length
          ? [...selectedType.prompt]
          : [
              {
                content: "",
                version: 1,
                model: "gpt-4o",
                active: true,
              },
            ],
      })
    }
  }, [selectedType])

  // Initialize form
  useEffect(() => {
    resetForm()
  }, [resetForm])

  const handleCreateNew = () => {
    setIsCreating(true)
    setIsEditing(false)
    setSelectedType(null)
    setFormData({
      name: "",
      description: "",
      subcategories: [{
        name: "",
        prompt: [{
          content: "",
          version: 1,
          model: "gpt-4o",
          active: true,
        }]
      }],
      prompt: [
        {
          content: "",
          version: 1,
          model: "gpt-4o",
          active: true,
        },
      ],
    })
  }

  const handleSelectType = (type: BusinessType) => {
    if (isEditing || isCreating) return
    setSelectedType(type)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setIsCreating(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setIsCreating(false)
    resetForm()
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Business type name is required",
        variant: "destructive",
      })
      return
    }

    // Validate subcategory names
    for (const subcategory of formData.subcategories) {
      if (!subcategory.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Subcategory names cannot be empty",
          variant: "destructive",
        })
        return
      }
    }

    setIsSaving(true)

    try {
      // Filter out empty prompts
      const filteredPrompts = formData.prompt.filter(prompt => prompt.content.trim() !== "")

      // Filter out empty subcategory prompts
      const filteredSubcategories = formData.subcategories
        .filter(sub => sub.name.trim() !== "")
        .map(sub => ({
          ...sub,
          prompt: sub.prompt.filter(p => p.content.trim() !== "")
        }))

      const dataToSave = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        subcategories: filteredSubcategories.map(sub => sub.name),
        prompt: filteredPrompts,
      }

      let savedType: BusinessType

      if (isCreating) {
        savedType = await createBusinessType(dataToSave)
        setBusinessTypes([...businessTypes, savedType])
        setSelectedType(savedType)
        toast({
          title: "Success",
          description: "Business type created successfully",
        })
      } else if (selectedType) {
        // For update, only send subcategory names as string[]
        const updateData = {
          ...dataToSave,
          subcategories: filteredSubcategories.map(sub => sub.name),
        }
        savedType = await updateBusinessType(selectedType._id, updateData)
        const updatedTypes = businessTypes.map((type) => (type._id === selectedType._id ? savedType : type))
        setBusinessTypes(updatedTypes)
        setSelectedType(savedType)
        toast({
          title: "Success",
          description: "Business type updated successfully",
        })
      }

      setIsEditing(false)
      setIsCreating(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save business type",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
    router.push(`/configure-leads?refreshId=${new Date().getTime()}`)
  }

  const handleDelete = async () => {
    if (!selectedType) return

    setIsDeleting(true)

    try {
      await deleteBusinessType(selectedType._id)
      const updatedTypes = businessTypes.filter((type) => type._id !== selectedType._id)
      setBusinessTypes(updatedTypes)
      
      if (updatedTypes.length > 0) {
        setSelectedType(updatedTypes[0])
      } else {
        setSelectedType(null)
      }
      
      setIsEditing(false)
      setIsCreating(false)

      toast({
        title: "Success",
        description: "Business type deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete business type",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const addSubcategory = () => {
    setFormData({
      ...formData,
      subcategories: [
        ...formData.subcategories,
        {
          name: "",
          prompt: [{
            content: "",
            version: 1,
            model: "gpt-4o",
            active: true,
          }]
        }
      ],
    })
  }

  const removeSubcategory = (index: number) => {
    setFormData({
      ...formData,
      subcategories: formData.subcategories.filter((_, i) => i !== index),
    })
  }

  const updateSubcategoryName = (index: number, value: string) => {
    const updated = [...formData.subcategories]
    updated[index] = { ...updated[index], name: value }
    setFormData({
      ...formData,
      subcategories: updated,
    })
  }

  const addSubcategoryPrompt = (subcategoryIndex: number) => {
    const updated = [...formData.subcategories]
    updated[subcategoryIndex].prompt = [
      ...updated[subcategoryIndex].prompt,
      {
        content: "",
        version: updated[subcategoryIndex].prompt.length + 1,
        model: "gpt-4o",
        active: true,
      }
    ]
    setFormData({
      ...formData,
      subcategories: updated,
    })
  }

  const removeSubcategoryPrompt = (subcategoryIndex: number, promptIndex: number) => {
    const updated = [...formData.subcategories]
    updated[subcategoryIndex].prompt = updated[subcategoryIndex].prompt.filter((_, i) => i !== promptIndex)
    setFormData({
      ...formData,
      subcategories: updated,
    })
  }

  const updateSubcategoryPrompt = (
    subcategoryIndex: number,
    promptIndex: number,
    field: keyof BusinessTypePrompt,
    value: any
  ) => {
    const updated = [...formData.subcategories]
    const prompt = { ...updated[subcategoryIndex].prompt[promptIndex] }
    // @ts-ignore
    prompt[field] = value
    updated[subcategoryIndex].prompt[promptIndex] = prompt
    setFormData({
      ...formData,
      subcategories: updated,
    })
  }

  const addPrompt = () => {
    setFormData({
      ...formData,
      prompt: [
        ...formData.prompt,
        {
          content: "",
          version: formData.prompt.length + 1,
          model: "gpt-4o",
          active: true,
        },
      ],
    })
  }

  const removePrompt = (index: number) => {
    setFormData({
      ...formData,
      prompt: formData.prompt.filter((_, i) => i !== index),
    })
  }

  const updatePrompt = (index: number, field: keyof BusinessTypePrompt, value: any) => {
    const updated = [...formData.prompt]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({
      ...formData,
      prompt: updated,
    })
  }

  const isFormMode = isEditing || isCreating

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Left Column - Business Types List */}
      <div className="w-80 bg-gray-50 rounded-lg overflow-hidden">
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-blue-800">Business Types</h3>
            <Button size="sm" onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>
        <div className="flex flex-col overflow-y-auto max-h-full">
          {businessTypes.map((type, index) => (
            <button
              key={type._id || index}
              className={`p-4 text-left hover:bg-blue-50 transition-colors border-b ${
                selectedType?._id === type._id ? "bg-blue-100 border-l-4 border-blue-600" : ""
              }`}
              onClick={() => handleSelectType(type)}
              disabled={isFormMode}
            >
              <div className="font-medium">{type.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {type.subcategories?.length || 0} subcategories • {type.prompt?.length || 0} prompts
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {type.createdAt ? new Date(type.createdAt).toLocaleDateString() : "No date"}
              </div>
            </button>
          ))}
          {businessTypes.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No business types found</p>
              <p className="text-sm">Create your first business type</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Business Type Details */}
      <div className="flex-1">
        {selectedType || isCreating ? (
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    {isCreating ? "Create New Business Type" : selectedType?.name || "Unnamed Type"}
                  </CardTitle>
                  <CardDescription>
                    {isCreating
                      ? "Configure a new business type with subcategories and AI prompts"
                      : "Manage subcategories and AI prompts for this business type"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {isFormMode ? (
                    <>
                      <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={handleEdit}>
                        <Settings className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      {selectedType && (
                        <Button variant="outline" onClick={handleDelete} disabled={isDeleting}>
                          {isDeleting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Delete
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 overflow-y-auto max-h-[calc(100vh-300px)]">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Business Type Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Restaurant, Technology, Healthcare"
                    disabled={!isFormMode}
                    className={!isFormMode ? "bg-gray-50" : ""}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this business type and its characteristics..."
                    disabled={!isFormMode}
                    className={!isFormMode ? "bg-gray-50" : ""}
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Subcategories */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Subcategories</Label>
                  {isFormMode && (
                    <Button type="button" variant="outline" size="sm" onClick={addSubcategory}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Subcategory
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {formData.subcategories.map((subcategory, scIndex) => (
                    <Card key={scIndex} className="p-4">
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            value={subcategory.name}
                            onChange={(e) => updateSubcategoryName(scIndex, e.target.value)}
                            placeholder="Enter subcategory name"
                            disabled={!isFormMode}
                            className={!isFormMode ? "bg-gray-50" : ""}
                          />
                          {isFormMode && formData.subcategories.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeSubcategory(scIndex)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Subcategory Prompts */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label>AI Prompts for this Subcategory</Label>
                            {isFormMode && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => addSubcategoryPrompt(scIndex)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Prompt
                              </Button>
                            )}
                          </div>

                          <div className="space-y-4">
                            {subcategory.prompt.map((prompt, pIndex) => (
                              <Card key={pIndex} className="p-4">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <Label className="text-sm font-medium">Prompt {pIndex + 1}</Label>
                                    <div className="flex items-center gap-2">
                                      {isFormMode && (
                                        <div className="flex items-center gap-2">
                                          <Label htmlFor={`active-${scIndex}-${pIndex}`} className="text-sm">
                                            Active
                                          </Label>
                                          <Switch
                                            id={`active-${scIndex}-${pIndex}`}
                                            checked={prompt.active}
                                            onCheckedChange={(checked) => 
                                              updateSubcategoryPrompt(scIndex, pIndex, "active", checked)
                                            }
                                          />
                                        </div>
                                      )}
                                      {isFormMode && subcategory.prompt.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeSubcategoryPrompt(scIndex, pIndex)}
                                          className="text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor={`model-${scIndex}-${pIndex}`}>Model</Label>
                                      <Select
                                        value={prompt.model}
                                        onValueChange={(value) => 
                                          updateSubcategoryPrompt(scIndex, pIndex, "model", value)
                                        }
                                        disabled={!isFormMode}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <Label htmlFor={`version-${scIndex}-${pIndex}`}>Version</Label>
                                      <Input
                                        id={`version-${scIndex}-${pIndex}`}
                                        type="number"
                                        value={prompt.version || 1}
                                        onChange={(e) => 
                                          updateSubcategoryPrompt(scIndex, pIndex, "version", Number.parseInt(e.target.value) || 1)
                                        }
                                        disabled={!isFormMode}
                                        className={!isFormMode ? "bg-gray-50" : ""}
                                        min={1}
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <Label htmlFor={`content-${scIndex}-${pIndex}`}>Prompt Content</Label>
                                    <Textarea
                                      id={`content-${scIndex}-${pIndex}`}
                                      value={prompt.content}
                                      onChange={(e) => 
                                        updateSubcategoryPrompt(scIndex, pIndex, "content", e.target.value)
                                      }
                                      placeholder="Enter the AI prompt content for this subcategory..."
                                      disabled={!isFormMode}
                                      className={!isFormMode ? "bg-gray-50" : ""}
                                      rows={4}
                                    />
                                  </div>

                                  {!isFormMode && (
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                      <Badge variant={prompt.active ? "success" : "secondary"}>
                                        {prompt.active ? "Active" : "Inactive"}
                                      </Badge>
                                      <span>Model: {prompt.model}</span>
                                      <span>Version: {prompt.version || 1}</span>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {!isFormMode && selectedType?.subcategories && selectedType.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedType.subcategories.map((sub, index) => (
                      <Badge key={index} variant="outline">
                        {sub.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Business Type Prompts */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Business Type Prompts</Label>
                  {isFormMode && (
                    <Button type="button" variant="outline" size="sm" onClick={addPrompt}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Prompt
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {formData.prompt.map((prompt, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium">Prompt {index + 1}</Label>
                          <div className="flex items-center gap-2">
                            {isFormMode && (
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`active-${index}`} className="text-sm">
                                  Active
                                </Label>
                                <Switch
                                  id={`active-${index}`}
                                  checked={prompt.active}
                                  onCheckedChange={(checked) => updatePrompt(index, "active", checked)}
                                />
                              </div>
                            )}
                            {isFormMode && formData.prompt.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removePrompt(index)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`model-${index}`}>Model</Label>
                            <Select
                              value={prompt.model}
                              onValueChange={(value) => updatePrompt(index, "model", value)}
                              disabled={!isFormMode}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gpt-4">GPT-4</SelectItem>
                                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor={`version-${index}`}>Version</Label>
                            <Input
                              id={`version-${index}`}
                              type="number"
                              value={prompt.version || 1}
                              onChange={(e) => updatePrompt(index, "version", Number.parseInt(e.target.value) || 1)}
                              disabled={!isFormMode}
                              className={!isFormMode ? "bg-gray-50" : ""}
                              min={1}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`content-${index}`}>Prompt Content</Label>
                          <Textarea
                            id={`content-${index}`}
                            value={prompt.content}
                            onChange={(e) => updatePrompt(index, "content", e.target.value)}
                            placeholder="Enter the AI prompt content for this business type..."
                            disabled={!isFormMode}
                            className={!isFormMode ? "bg-gray-50" : ""}
                            rows={4}
                          />
                        </div>

                        {!isFormMode && (
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <Badge variant={prompt.active ? "success" : "secondary"}>
                              {prompt.active ? "Active" : "Inactive"}
                            </Badge>
                            <span>Model: {prompt.model}</span>
                            <span>Version: {prompt.version || 1}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Business Type Selected</h3>
              <p className="text-gray-500 mb-4">Select a business type from the list to view and edit its details</p>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Business Type
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}