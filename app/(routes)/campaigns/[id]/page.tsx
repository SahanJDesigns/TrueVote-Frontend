"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Web3 from "web3"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Loader2, ArrowLeft, Check, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DashboardHeader } from "@/components/dashboard-header"
import { FACTORY_ABI, FACTORY_ADDRESS, CAMPAIGN_ABI } from "@/lib/constants"
import { BiometricVerification } from "@/components/biometric-verification"
import { ReCaptcha } from "@/components/recaptcha"
import { Badge } from "@/components/ui/badge"

interface Candidate {
  id: string
  name: string
  votes: number
  description: string
}

interface Campaign {
  id: string
  title: string
  description: string
  totalVotes: number
  endDate: string
  candidates: Candidate[]
}

export default function VotingPage() {
  const [web3, setWeb3] = useState<Web3 | null>(null)
  const [campaignAddress, setCampaignAddress] = useState<string | null>(null)
  const [account, setAccount] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)
  const router = useRouter()
  const params  = useParams();

  const [biometricVerified, setBiometricVerified] = useState(false)
  const [captchaVerified, setCaptchaVerified] = useState(false)

  const [isVoted, setIsVoted] = useState(false)
  const [campainState, setCampainState] = useState('')
  const [isOwner, setIsOwner] = useState(false)

  const [biometricVerificationAttemptNumber, setBiometricVerificationAttemptNumber] = useState(0)

  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        if (!window.ethereum) return alert("Please install MetaMask")

        const _web3 = new Web3(window.ethereum)
        setWeb3(_web3)
        await window.ethereum.request({ method: "eth_requestAccounts" })
        const accounts = await _web3.eth.getAccounts()

        const walletAddress = sessionStorage.getItem("wallet_address");
        if (walletAddress && accounts.includes(walletAddress)) {
          setAccount(walletAddress);
        }
        
        const factory = new _web3.eth.Contract(FACTORY_ABI, FACTORY_ADDRESS)
        setCampaignAddress(params.id as string)

        const campaignContract = new _web3.eth.Contract(CAMPAIGN_ABI, params.id as string)

        // Fetch campaign details separately
        const name = await campaignContract.methods.getCampaignName().call() as string;
        const description = await campaignContract.methods.getCampaignDescription().call() as string;
        const endTime = await campaignContract.methods.getEndTime().call() as string;
        const candidateCount = await campaignContract.methods.getCandidatesCount().call();
        const voteTotal = await campaignContract.methods.getVotersCount().call() as string;

          // isOwner fetching
          const isOwner = await campaignContract.methods.isOwner(accounts[0]).call() as boolean;
          setIsOwner(isOwner);

          // Campain state fetching
          const startTimestamp = await campaignContract.methods.getStartTime().call();
          const durationMinutes = await campaignContract.methods.getCampaignDuration().call();
          const startDate = new Date(Number(startTimestamp) * 1000)
          const endDate = new Date(startDate.getTime() + Number(durationMinutes) * 60000)
          const now = new Date()
          let status = "upcoming"
          if (now >= startDate && now <= endDate) status = "active"
          else if (now > endDate) status = "completed"
          setCampainState(status)

          //isvoted fetching
          const isVoted = await campaignContract.methods.isVoted(accounts[0]).call() as boolean;
          setIsVoted(isVoted);

        const candidates = await Promise.all(
          Array.from({ length: Number(candidateCount) }).map(async (_, i) => {
            const candidateData = await campaignContract.methods.getCandidate(i).call() as [string, string];
            const name = candidateData[0];
            const voteCount = candidateData[1];
        
            return {
              id: i.toString(),
              name,
              votes: parseInt(voteCount),
              description: `Candidate ${i + 1}`,
              imageUrl: "/placeholder.svg"
            };
          })
        );
        
        setCampaign({
          id: params.id as string,
          title: name,
          description,
          totalVotes: parseInt(voteTotal),
          endDate: new Date(parseInt(endTime) * 1000).toISOString().split("T")[0],
          candidates
        });

        // First, switch to WebSocket provider for event support
        const wsWeb3 = new Web3('ws://127.0.0.1:7545');
        const wsCampaignContract = new wsWeb3.eth.Contract(CAMPAIGN_ABI, params.id as string)
        
        // Subscribe to VoteCast events
        const voteCastEvent = wsCampaignContract.events.VoteCast();
        voteCastEvent.on('data', (event) => {
          const { candidateIndex, newVoteCount } = event.returnValues as { candidateIndex: string, newVoteCount: string }
          console.log(`New vote for candidate ${candidateIndex}, new count: ${newVoteCount}`);
          
          // Update the UI with the new vote count
          setCampaign(prevCampaign => {
            if (!prevCampaign) return prevCampaign;
            
            const newCandidates = [...prevCampaign.candidates];
            const index = parseInt(candidateIndex);
            
            if (newCandidates[index]) {
              newCandidates[index] = {
                ...newCandidates[index],
                votes: parseInt(newVoteCount)
              };
            }
            
            return {
              ...prevCampaign,
              candidates: newCandidates,
              totalVotes: prevCampaign.totalVotes + 1
            };
          });
        });
        
      } catch (err) {
        console.error("Failed to load campaign details", err)
        setError("Could not fetch campaign info from the blockchain.")
      } finally {
        setIsLoading(false)
      }
    }

    loadCampaign()

    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [params.id])

  const handleVote = async () => {
    if (!web3 || !campaignAddress || !selectedCandidate) return

    console.log(campaignAddress, selectedCandidate)
    setIsVoting(true)
    setError(null)

    try {
      const contract = new web3.eth.Contract(CAMPAIGN_ABI, campaignAddress)
      await contract.methods.vote(parseInt(selectedCandidate)).send({ from: account })
      setIsVoted(true)
    } catch (err: any) {
      setError(err.message || "Voting failed. Please try again.")
    } finally {
      setIsVoting(false)
    }
  }

  const getVotePercentage = (votes: number) => {
    if (!campaign || campaign.totalVotes === 0) return 0
    return (votes / campaign.totalVotes) * 100
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "completed":
        return "bg-slate-500/10 text-slate-300 border-slate-500/20"
      case "upcoming":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/20"
    }
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
          <Button onClick={() => router.push("/campaigns")}>Back to Campaigns</Button>
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
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Campaigns
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{campaign.title}</h1>
          <p className="text-slate-400">{campaign.description}</p>
          <div className="mt-3 text-slate-400 flex items-center gap-2">
            {isOwner && (
              <Badge className={"bg-purple-500/10 text-purple-500 border-purple-500/20"}>
                Campaign Owner
              </Badge>
            )}
            <Badge className={getStatusColor(campainState)}>
              {campainState.charAt(0).toUpperCase() + campainState.slice(1)}
            </Badge>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isVoted && campainState === 'active' && !isOwner && (
          <Card className="border-green-600 bg-green-900/10 backdrop-blur-sm mb-8">
            <CardContent className="pt-6 text-center">
              <div className="rounded-full bg-green-500/20 p-3 w-16 h-16 mx-auto mb-4">
                <Check className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Voted Successfully</h3>
              <p className="text-slate-300 mb-4">
                Your vote has been recorded on the blockchain. Thank you!
              </p>
              <Button onClick={() => router.push("/campaigns")} className="bg-green-600 hover:bg-green-700">
                Return to Campaigns
              </Button>
            </CardContent>
          </Card>
        )}

        {campainState === 'active' && !isVoted && !isOwner && (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Cast Your Vote</CardTitle>
              <CardDescription className="text-slate-400">Select one option to vote</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedCandidate || ""} onValueChange={setSelectedCandidate}>
                <div className="space-y-4">
                  {campaign.candidates.map((candidate) => (
                    <div key={parseInt(candidate.id)} className="flex items-start space-x-3">
                      <RadioGroupItem value={candidate.id} id={`candidate-${candidate.id}`} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={`candidate-${candidate.id}`} className="text-white font-medium text-base cursor-pointer">
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
              <div className="w-full space-y-4">
                  {!captchaVerified && (
                    <div className="border border-slate-700 rounded-md p-4">
                      <p className="text-sm text-slate-400 mb-3">Please verify that you are not a robot:</p>
                      <ReCaptcha onVerify={() => setCaptchaVerified(true)} />
                    </div>
                  )}
                   {!biometricVerified && (
                    <div className="border border-slate-700 rounded-md p-4">
                      <p className="text-sm text-slate-400 mb-3">Please verify your identity:</p>
                      <BiometricVerification verified = {biometricVerified} setVerified={setBiometricVerified} attemptnumber={biometricVerificationAttemptNumber} setAttemptNumber={setBiometricVerificationAttemptNumber} account= {account} />
                    </div>
                  )}

                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={!selectedCandidate || isVoting || !biometricVerified || !captchaVerified}
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
                </div>
            </CardFooter>
          </Card>
        )}
        
        {/* Always show results for owner, otherwise only show if voted or campaign completed */}
        {(isOwner || isVoted || campainState === 'completed') && (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">
                {campainState === 'completed' ? 'Final Results' : 'Current Results'}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {campainState === 'completed' 
                  ? 'Final voting results are as follows' 
                  : 'Current voting results are as follows'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {campaign.candidates.map((candidate) => (
                  <div key={parseInt(candidate.id)} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">{candidate.name}</span>
                      <span className="text-slate-400 text-sm">
                        {candidate.votes} votes ({getVotePercentage(candidate.votes).toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={getVotePercentage(candidate.votes)} className="h-2 bg-slate-700" />
                  </div>
                ))}
                {/* Total Votes Casted */}
                <hr className="border-t border-slate-700 my-4" />
                <div className="flex justify-end items-center">
                  <span className="text-slate-400 text-lg">{campaign.totalVotes} Total Votes Casted</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
