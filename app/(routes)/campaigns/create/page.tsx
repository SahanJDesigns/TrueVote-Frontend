"use client"

import type React from "react"

import { useState, useEffect, ChangeEvent } from "react";
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
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowedWallets, setAllowedWallets] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);

  useEffect(() => {
      const loadBlockchain = async () => {
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
  
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const accounts = await web3Instance.eth.getAccounts();
          
          const walletAddress = sessionStorage.getItem("wallet_address");
  
          if (walletAddress && accounts.includes(walletAddress)) {
            setAccount(walletAddress);
          }
        
          if (walletAddress && walletAddress == accounts[0]) {
              setAccount(walletAddress);
          }else{
            throw new Error("Please keep your login wallet as your active wallet.");
          }
  
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
    console.log("Creating campaign with candidates:", candidateNames)
    console.log("Duration in minutes:", durationInMinutes)
    console.log("Campain Title:", title)
    console.log("Campaign Description:", description)
    console.log("Start Timestamp:", startTimestamp)
    console.log("Start Time:", startTime)
    console.log("Allowed Wallets:", allowedWallets)
    console.log("Is Private:", isPrivate)

    const receipt = await factory.methods
    .createCampaign(
      candidateNames,
      durationInMinutes,
      title,
      description,
      startTimestamp,
      startTime,
      allowedWallets,
      !isPrivate
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

  function handleCsvUpload(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.name.endsWith(".csv")) {
      setCsvError("Please upload a CSV file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setCsvError("Failed to read file.");
        return;
      }
      // Split by line, trim, filter empty, and validate Ethereum addresses
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      const addresses: string[] = [];
      const invalidLines: string[] = [];
      lines.forEach(line => {
        // Remove commas and split if CSV has multiple columns
        const parts = line.split(",");
        parts.forEach(part => {
          const addr = part.trim();
          if (addr) {
            addresses.push(addr);
          } else if (addr) {
            invalidLines.push(addr);
          }
        });
      });
      let verifiedAddresses: string[] = [];
      try {
        const response = await fetch("http://localhost:8000/api/users/verify_users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 'wallet_addresses': [...addresses] }),
        });
        if (response.ok) {
          const data = await response.json();
          verifiedAddresses = data.registered_wallets || [];
        } else {
          setCsvError("Failed to verify addresses.");
          setAllowedWallets([]);
          return;
        }
      } catch (err) {
        setCsvError("Failed to verify addresses.");
        setAllowedWallets([]);
        return;
      }

      if (verifiedAddresses.length === 0) {
        setCsvError("No valid Ethereum addresses found in CSV.");
        setAllowedWallets([]);
        return;
      }
      setAllowedWallets(verifiedAddresses);
      setCsvError(
        invalidLines.length > 0
          ? `Some invalid addresses were ignored: ${invalidLines.join(", ")}`
          : null
      );
    };
    reader.onerror = () => {
      setCsvError("Failed to read file.");
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
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

        <form onSubmit={handleSubmit} >
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
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white">Campaign Visibility</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant={isPrivate ? "outline" : "default"}
                      className={isPrivate ? "bg-transparent border-slate-600 text-slate-300" : "bg-orange-500 text-white"}
                      onClick={() => setIsPrivate(false)}
                    >
                      Public
                    </Button>
                    <Button
                      type="button"
                      variant={isPrivate ? "default" : "outline"}
                      className={isPrivate ? "bg-orange-500 text-white" : "bg-transparent border-slate-600 text-slate-300"}
                      onClick={() => setIsPrivate(true)}
                    >
                      Private
                    </Button>
                  </div>
                  {isPrivate && (
                    <div className="mt-4">
                        <Label className="text-white mb-1 block py-2">Upload Allowed Wallets (CSV)</Label>
                        <div
                          className="bg-slate-900 border border-dashed border-slate-700 rounded-md p-4 text-center cursor-pointer hover:border-orange-500 transition-colors"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                              handleCsvUpload({
                                target: { files: e.dataTransfer.files },
                              } as unknown as ChangeEvent<HTMLInputElement>);
                            }
                          }}
                          onClick={() => {
                            const input = document.getElementById("csv-upload-input");
                            input?.click();
                          }}
                        >
                          <Input
                            id="csv-upload-input"
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleCsvUpload}
                          />
                          {allowedWallets.length === 0 ? (
                            <p className="text-slate-400">
                              Drag and drop your CSV file here
                            </p>
                          ) : (
                            <div className="flex items-center justify-between bg-slate-800 rounded p-3 mt-2">
                              <div className="flex items-center gap-3">
                                <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                                  <rect width="24" height="24" rx="6" fill="#F59E42" fillOpacity="0.15"/>
                                  <path d="M7 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.828a2 2 0 0 0-.586-1.414l-2.828-2.828A2 2 0 0 0 14.172 3H7zm7 1.414L18.586 9H15a1 1 0 0 1-1-1V4.414z" fill="#F59E42"/>
                                </svg>
                                <div className="text-left">
                                  <div className="text-white font-medium">
                                    {/* Show filename and size if available */}
                                    {(document?.getElementById("csv-upload-input") as HTMLInputElement | null)?.files?.[0]?.name || "wallets.csv"}
                                  </div>
                                  <div className="text-slate-400 text-xs">
                                    {(() => {
                                      const file = (document?.getElementById("csv-upload-input") as HTMLInputElement | null)?.files?.[0];
                                      if (file) {
                                        const sizeKB = (file.size / 1024).toFixed(1);
                                        return `${sizeKB} KB`;
                                      }
                                      return "";
                                    })()}
                                  </div>
                                </div>
                              </div>
                                <Button
                                type="button"
                                variant="ghost"
                                className="text-red-400 hover:bg-red-900/20 p-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAllowedWallets([]);
                                  setCsvError(null);
                                  const input = document.getElementById("csv-upload-input") as HTMLInputElement;
                                  if (input) input.value = "";
                                }}
                                aria-label="Remove CSV"
                                >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="20"
                                  height="20"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  className="text-red-400"
                                >
                                  <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6m3 0v12m4-12v12m4-12v12"
                                  />
                                </svg>
                                </Button>
                            </div>
                          )}
                        </div>
                        {csvError && (
                        <p className="text-red-400 text-sm mt-2">{csvError}</p>
                      )}
                      {allowedWallets.length > 0 && (
                        <div className="bg-green-900/20 border border-green-700 rounded-md p-3 mt-2">
                          <p className="text-green-400 text-sm">
                          {allowedWallets.length} voters in your CSV have been loaded successfully and will be eligible for this campaign.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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
