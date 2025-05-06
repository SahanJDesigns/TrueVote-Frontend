"use client"

import type React from "react"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/date-picker"
import { Loader2, ArrowLeft, Plus, Calendar, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardHeader } from "@/components/dashboard-header"
import { CandidateInput } from "@/components/candidate-input"

import Web3 from "web3";
import { FACTORY_ABI, FACTORY_ADDRESS } from "@/lib/constants";


interface Candidate {
  id: string
  name: string
}

export default function CreateCampaignPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [candidates, setCandidates] = useState<Candidate[]>([
    { id: "1", name: "" },
    { id: "2", name: "" },
  ])

  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [factory, setFactory] = useState<any>(null);
  const [account, setAccount] = useState("");

  useEffect(() => {
      const loadBlockchain = async () => {
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
  
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);
  
          const factoryInstance = new web3Instance.eth.Contract(
            FACTORY_ABI,
            FACTORY_ADDRESS
          );
          setFactory(factoryInstance);
        } else {
          alert("Please install MetaMask to continue.");
        }
      };
  
      loadBlockchain();
    }, []);

  const addCandidate = () => {
    setCandidates([
      ...candidates,
      {
        id: `${candidates.length + 1}`,
        name: "",
      },
    ])
  }

  const removeCandidate = (id: string) => {
    if (candidates.length <= 2) {
      setError("A campaign must have at least 2 candidates")
      return
    }
    setCandidates(candidates.filter((candidate) => candidate.id !== id))
  }

  const updateCandidate = (id: string, field: keyof Candidate, value: string) => {
    setCandidates(candidates.map((candidate) => (candidate.id === id ? { ...candidate, [field]: value } : candidate)))
  }

  const validateForm = () => {
    if (!title.trim()) {
      setError("Campaign title is required")
      return false
    }

    if (!description.trim()) {
      setError("Campaign description is required")
      return false
    }

    if (!startDate) {
      setError("Start date is required")
      return false
    }

    if (!endDate) {
      setError("End date is required")
      return false
    }

    if (startDate >= endDate) {
      setError("End date must be after start date")
      return false
    }

    const now = new Date()
    if (startDate < now) {
      setError("Start date cannot be in the past")
      return false
    }

    const invalidCandidates = candidates.filter((candidate) => !candidate.name.trim())
    if (invalidCandidates.length > 0) {
      setError("All candidates must have a name")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!factory) {
      setError("Smart contract not initialized yet.");
      return;
    }

    setError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    const candidateNames = candidates.map((candidate) => candidate.name.trim()).filter((name) => name !== "")
    const durationInMinutes = Math.floor((endDate!.getTime() - startDate!.getTime()) / 60000)
    const startTimestamp = Math.floor(startDate!.getTime() / 1000)
    const startTime = startDate!.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    console.log(
      {
        candidateNames,
        durationInMinutes,
        title,
        description,
        startTimestamp,
        startTime,
      }
    )
    const receipt = await factory.methods
    .createCampaign(
      candidateNames,
      durationInMinutes,
      title,
      description,
      startTimestamp,
      startTime
       // passing readable time for frontend display
    )
    .send({ from: account });

    
    try {
      const event = receipt.events?.CampaignCreated;
      if (event && event.returnValues?.campaignAddress) {
        const campaignAddress = event.returnValues.campaignAddress;
      } else {
        setError("⚠️ Campaign created, but no event log found.");
      }
      // Redirect to campaigns page after successful creation
      setIsSubmitting(false)
      setError(null)
      router.push("/campaigns")
    } catch (err: any) {
      setError(err.message || "Failed to create campaign")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="text-slate-400 hover:text-white mb-6"
          onClick={() => router.push("/campaigns")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create New Campaign</h1>
          <p className="text-slate-400">Set up a new voting campaign for your community</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-8">
            {/* Campaign Details */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">Campaign Details</CardTitle>
                <CardDescription className="text-slate-400">
                  Provide the basic information about your campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-red-900/20 border-red-800 mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">
                    Campaign Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter campaign title"
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this campaign is about"
                    className="bg-slate-900 border-slate-700 text-white min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Start Date</Label>
                    <DatePicker date={startDate} setDate={setStartDate} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">End Date</Label>
                    <DatePicker date={endDate} setDate={setEndDate} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Candidates */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl font-bold text-white">Candidates</CardTitle>
                    <CardDescription className="text-slate-400">Add the options voters can choose from</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={addCandidate}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Candidate
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {candidates.map((candidate, index) => (
                  <CandidateInput
                    key={candidate.id}
                    candidate={candidate}
                    index={index}
                    updateCandidate={updateCandidate}
                    removeCandidate={removeCandidate}
                    showRemoveButton={candidates.length > 2}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end">
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={isSubmitting} size="lg">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Campaign...
                  </>
                ) : (
                  "Create Campaign"
                )}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
