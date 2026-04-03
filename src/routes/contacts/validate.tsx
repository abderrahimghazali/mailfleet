import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/PageHeader'
import { route } from '@/constants/routes'
import { useEffect, useState } from 'react'
import { DatabaseService } from '@/services/database'
import type { ContactList, ValidationSummary } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from 'sonner'
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Shield, Mail } from 'lucide-react'

export const Route = createFileRoute('/contacts/validate')({
  component: ValidateContacts,
})

function ValidateContacts() {
  const [contactLists, setContactLists] = useState<ContactList[]>([])
  const [selectedListId, setSelectedListId] = useState('')
  const [manualEmails, setManualEmails] = useState('')
  const [validating, setValidating] = useState(false)
  const [results, setResults] = useState<ValidationSummary | null>(null)

  useEffect(() => {
    DatabaseService.getContactLists().then(setContactLists).catch(console.error)
  }, [])

  const handleValidateManual = async () => {
    const emails = manualEmails
      .split(/[\n,;]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0)

    if (emails.length === 0) {
      toast.error('Enter at least one email address')
      return
    }

    setValidating(true)
    setResults(null)
    try {
      const summary = await DatabaseService.validateEmails(emails)
      setResults(summary)
      toast.success(`Validated ${summary.total} emails`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setValidating(false)
    }
  }

  const handleValidateList = async () => {
    if (!selectedListId) {
      toast.error('Select a contact list')
      return
    }

    setValidating(true)
    setResults(null)
    try {
      const summary = await DatabaseService.validateContactList(selectedListId)
      setResults(summary)
      toast.success(`Validated ${summary.total} emails`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setValidating(false)
    }
  }

  const breadcrumbs = [
    { label: "Dashboard", href: route.dashboard },
    { label: "Contacts", href: route.contacts },
    { label: "Validate Emails" }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800"><CheckCircle2 className="h-3 w-3 mr-1" />Valid</Badge>
      case 'invalid':
        return <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800"><XCircle className="h-3 w-3 mr-1" />Invalid</Badge>
      case 'risky':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800"><AlertTriangle className="h-3 w-3 mr-1" />Risky</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <div>
          <h1>Email Validation</h1>
          <p className="text-muted-foreground mt-1">
            Check email addresses for format, DNS records, disposable providers, and role-based addresses.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Validate by List */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Validate Contact List
              </CardTitle>
              <CardDescription>
                Select a contact list to validate all emails in it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Contact List</Label>
                <Select value={selectedListId} onValueChange={setSelectedListId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a list..." />
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
                onClick={handleValidateList}
                disabled={validating || !selectedListId}
                className="w-full"
              >
                {validating ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Validating...</>
                ) : (
                  'Validate List'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Validate Manual */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Mail className="h-5 w-5 text-primary" />
                Validate Emails Manually
              </CardTitle>
              <CardDescription>
                Paste email addresses (one per line, or comma/semicolon separated).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email Addresses</Label>
                <Textarea
                  value={manualEmails}
                  onChange={(e) => setManualEmails(e.target.value)}
                  placeholder={"john@example.com\njane@company.org\ntest@tempmail.com"}
                  rows={4}
                />
              </div>
              <Button
                onClick={handleValidateManual}
                disabled={validating || !manualEmails.trim()}
                className="w-full"
              >
                {validating ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Validating...</>
                ) : (
                  'Validate Emails'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {results && (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="shadow-sm">
                <CardContent className="p-5 text-center">
                  <p className="text-3xl font-display font-bold">{results.total}</p>
                  <p className="text-sm text-muted-foreground">Total Checked</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-5 text-center">
                  <p className="text-3xl font-display font-bold text-emerald-600">{results.valid}</p>
                  <p className="text-sm text-muted-foreground">Valid</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-5 text-center">
                  <p className="text-3xl font-display font-bold text-red-600">{results.invalid}</p>
                  <p className="text-sm text-muted-foreground">Invalid</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-5 text-center">
                  <p className="text-3xl font-display font-bold text-amber-600">{results.risky}</p>
                  <p className="text-sm text-muted-foreground">Risky</p>
                </CardContent>
              </Card>
            </div>

            {/* Results Table */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg">Validation Results</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All ({results.total})</TabsTrigger>
                    <TabsTrigger value="valid">Valid ({results.valid})</TabsTrigger>
                    <TabsTrigger value="invalid">Invalid ({results.invalid})</TabsTrigger>
                    <TabsTrigger value="risky">Risky ({results.risky})</TabsTrigger>
                  </TabsList>

                  {['all', 'valid', 'invalid', 'risky'].map((tab) => (
                    <TabsContent key={tab} value={tab}>
                      <div className="border rounded-lg mt-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Email</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>MX Record</TableHead>
                              <TableHead>Reason</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {results.results
                              .filter(r => tab === 'all' || r.status === tab)
                              .map((r, i) => (
                                <TableRow key={i}>
                                  <TableCell className="font-mono text-sm">{r.email}</TableCell>
                                  <TableCell>{getStatusBadge(r.status)}</TableCell>
                                  <TableCell>
                                    {r.has_mx ? (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{r.reason}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  )
}
