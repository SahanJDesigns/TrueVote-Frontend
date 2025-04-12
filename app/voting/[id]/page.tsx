"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Loader2, ArrowLeft, Check, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardHeader } from "@/components/dashboard-header"

interface Candidate {
  id: string
  name: string
  description: string
  imageUrl: string
  votes: number
}

interface Campaign {
  id: string
  title: string
  description: string
  totalVotes: number
  endDate: string
  candidates: Candidate[]
}

export default function VotingPage({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const [isVoted, setIsVoted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Simulate fetching campaign details from blockchain
    const fetchCampaign = async () => {
      try {
        // In a real app, this would be fetched from the blockchain
        await new Promise((resolve) => setTimeout(resolve, 1500))

        setCampaign({
          id: params.id,
          title: "Community Treasury Allocation",
          description:
            "Vote on how to allocate the community treasury funds for Q2 2023. This decision will determine the focus of our development efforts for the next quarter.",
          totalVotes: 1243,
          endDate: "2023-04-15",
          candidates: [
            {
              id: "1",
              name: "DeFi Integration Expansion",
              description: "Focus on expanding integrations with other DeFi protocols to increase interoperability",
              imageUrl: "/placeholder.svg?height=80&width=80",
              votes: 523,
            },
            {
              id: "2",
              name: "Security Audits & Improvements",
              description: "Allocate funds to comprehensive security audits and implement recommended improvements",
              imageUrl: "/placeholder.svg?height=80&width=80",
              votes: 412,
            },
            {
              id: "3",
              name: "User Interface Overhaul",
              description: "Redesign the user interface to improve user experience and accessibility",
              imageUrl: "/placeholder.svg?height=80&width=80",
              votes: 308,
            },
          ],
        })
      } catch (error) {
        console.error("Error fetching campaign:", error)
        setError("Failed to load campaign details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCampaign()
  }, [params.id])

  const handleVote = async () => {
    if (!selectedCandidate) return

    setIsVoting(true)
    setError(null)

    try {
      // Simulate blockchain transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setIsVoted(true)
    } catch (err: any) {
      setError(err.message || "Failed to submit vote")
    } finally {
      setIsVoting(false)
    }
  }

  const getTotalVotes = () => {
    if (!campaign) return 0
    return campaign.candidates.reduce((sum, candidate) => sum + candidate.votes, 0)
  }

  const getVotePercentage = (votes: number) => {
    const total = getTotalVotes()
    if (total === 0) return 0
    return (votes / total) * 100
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Campaign Not Found</h1>
          <p className="text-slate-400 mb-4">The campaign you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/campaigns")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>
      </div>
    )
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
          <h1 className="text-3xl font-bold text-white mb-2">{campaign.title}</h1>
          <p className="text-slate-400">{campaign.description}</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isVoted ? (
          <Card className="border-green-600 bg-green-900/10 backdrop-blur-sm mb-8">
            <CardContent className="pt-6 text-center">
              <div className="rounded-full bg-green-500/20 p-3 w-16 h-16 mx-auto mb-4">
                <Check className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Vote Submitted Successfully</h3>
              <p className="text-slate-300 mb-4">
                Your vote has been recorded on the blockchain. Thank you for participating!
              </p>
              <Button onClick={() => router.push("/campaigns")} className="bg-green-600 hover:bg-green-700">
                Return to Campaigns
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Cast Your Vote</CardTitle>
              <CardDescription className="text-slate-400">
                Select one of the following options to cast your vote
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedCandidate || ""} onValueChange={setSelectedCandidate}>
                <div className="space-y-4">
                  {campaign.candidates.map((candidate) => (
                    <div key={candidate.id} className="flex items-start space-x-3">
                      <RadioGroupItem value={candidate.id} id={`candidate-${candidate.id}`} className="mt-1" />
                      <div className="flex-1">
                        <Label
                          htmlFor={`candidate-${candidate.id}`}
                          className="text-white font-medium text-base cursor-pointer"
                        >
                          {candidate.name}
                        </Label>
                        <p className="text-slate-400 text-sm mt-1">{candidate.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={!selectedCandidate || isVoting}
                onClick={handleVote}
              >
                {isVoting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Vote...
                  </>
                ) : (
                  "Submit Vote"
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Current Results</CardTitle>
            <CardDescription className="text-slate-400">Live voting results from the blockchain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {campaign.candidates.map((candidate) => (
                <div key={candidate.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">{candidate.name}</span>
                    <span className="text-slate-400 text-sm">
                      {candidate.votes} votes ({getVotePercentage(candidate.votes).toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={getVotePercentage(candidate.votes)} className="h-2 bg-slate-700" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
