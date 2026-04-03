import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { ContactList, ImportResult, ColumnMapping } from '@/types/database'
import { open } from '@tauri-apps/plugin-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react'

export const Route = createFileRoute('/contacts/import')({
  component: ImportContacts,
})

type Step = 'select' | 'mapping' | 'importing' | 'results'

function ImportContacts() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('select')
  const [contactLists, setContactLists] = useState<ContactList[]>([])
  const [selectedListId, setSelectedListId] = useState('')
  const [filePath, setFilePath] = useState('')
  const [hasHeader, setHasHeader] = useState(true)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const [mapping, setMapping] = useState<ColumnMapping>({
    email: 0,
    first_name: 1,
    last_name: 2,
  })

  useEffect(() => {
    DatabaseService.getContactLists().then(setContactLists).catch(console.error)
  }, [])

  const handleSelectFile = async () => {
    try {
      const selected = await open({
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        multiple: false,
      })
      if (selected) {
        setFilePath(selected as string)
      }
    } catch (err) {
      console.error('Failed to open file dialog:', err)
      toast.error('Failed to open file picker')
    }
  }

  const handleStartImport = async () => {
    if (!filePath || !selectedListId) {
      toast.error('Please select a file and a contact list')
      return
    }

    setStep('importing')
    setImporting(true)

    try {
      const importResult = await DatabaseService.importContactsCsv(
        filePath,
        selectedListId,
        mapping,
        hasHeader
      )
      setResult(importResult)
      setStep('results')

      if (importResult.imported > 0) {
        toast.success(`Imported ${importResult.imported} contacts!`)
      } else {
        toast.warning('No new contacts were imported')
      }
    } catch (err) {
      console.error('Import failed:', err)
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Import failed: ${msg}`)
      setStep('mapping')
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setStep('select')
    setFilePath('')
    setSelectedListId('')
    setResult(null)
    setMapping({ email: 0, first_name: 1, last_name: 2 })
  }

  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Contacts", href: route.contacts },
    { label: "Import Contacts" }
  ]

  const columnOptions = Array.from({ length: 10 }, (_, i) => ({
    value: String(i),
    label: `Column ${i + 1}`,
  }))

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 max-w-2xl">
        {/* Step 1: Select File */}
        {step === 'select' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Contacts from CSV
              </CardTitle>
              <CardDescription>
                Upload a CSV file to bulk import contacts into a contact list.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>CSV File</Label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={handleSelectFile}>
                    <FileText className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  {filePath && (
                    <span className="text-sm text-muted-foreground truncate max-w-xs">
                      {filePath.split('/').pop()}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target Contact List</Label>
                <Select value={selectedListId} onValueChange={setSelectedListId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact list..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contactLists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name} ({list.contact_count} contacts)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => setStep('mapping')}
                disabled={!filePath || !selectedListId}
                className="w-full"
              >
                Continue to Column Mapping
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && (
          <Card>
            <CardHeader>
              <CardTitle>Column Mapping</CardTitle>
              <CardDescription>
                Map CSV columns to contact fields. Specify which column number contains each field (0-indexed).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasHeader}
                    onChange={(e) => setHasHeader(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">CSV has a header row (first row will be skipped)</span>
                </label>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Email Column (required)</Label>
                  <Select
                    value={String(mapping.email)}
                    onValueChange={(v) => setMapping(prev => ({ ...prev, email: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {columnOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>First Name Column (optional)</Label>
                  <Select
                    value={mapping.first_name !== undefined ? String(mapping.first_name) : 'none'}
                    onValueChange={(v) =>
                      setMapping(prev => ({
                        ...prev,
                        first_name: v === 'none' ? undefined : parseInt(v),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Skip</SelectItem>
                      {columnOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Last Name Column (optional)</Label>
                  <Select
                    value={mapping.last_name !== undefined ? String(mapping.last_name) : 'none'}
                    onValueChange={(v) =>
                      setMapping(prev => ({
                        ...prev,
                        last_name: v === 'none' ? undefined : parseInt(v),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Skip</SelectItem>
                      {columnOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleStartImport} disabled={importing}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Contacts
                </Button>
                <Button variant="outline" onClick={() => setStep('select')}>
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Importing */}
        {step === 'importing' && (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Importing contacts...</h3>
              <p className="text-muted-foreground">
                Please wait while we process your CSV file.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Results */}
        {step === 'results' && result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Import Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                  <p className="text-sm text-muted-foreground">Imported</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
                  <p className="text-sm text-muted-foreground">Skipped (duplicates)</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{result.errors.length}</p>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Errors
                  </Label>
                  <div className="border rounded-md max-h-40 overflow-y-auto p-3 bg-muted/50">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600 font-mono">{err}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => navigate({ to: '/contacts/$contactListId', params: { contactListId: selectedListId } })}
                >
                  View Contact List
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Import Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
