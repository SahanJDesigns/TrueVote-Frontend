"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Web3 from "web3"
import { FACTORY_ABI, FACTORY_ADDRESS, CAMPAIGN_ABI } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, Calendar, BarChart, Plus } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"

interface Campaign {
  id: string
  title: string
  description: string
  totalVotes: number
  status: "active" | "completed" | "upcoming"
  startDate: string
  endDate: string
}

export default function CampaignsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [search, setSearch] = useState("")
  const [startDateFilter, setStartDateFilter] = useState("")
  const [endDateFilter, setEndDateFilter] = useState("")
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([])



  function getFilteredCampaigns() {
    return campaigns
      .filter(campaign => {
        const matchesName = campaign.title.toLowerCase().includes(search.toLowerCase())
        const matchesStartDate = startDateFilter ? new Date(campaign.startDate) >= new Date(startDateFilter) : true
        const matchesEndDate = endDateFilter ? new Date(campaign.endDate) <= new Date(endDateFilter) : true
        return matchesName && matchesStartDate && matchesEndDate
      })
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
  }
  useEffect(() => {
    const filtered = getFilteredCampaigns()
    setFilteredCampaigns(filtered)
  }, [search, startDateFilter, endDateFilter, campaigns])

 
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (typeof window.ethereum === "undefined") {
        alert("Please install MetaMask")
        return
      }

      const web3 = new Web3(window.ethereum)
      const factory = new web3.eth.Contract(FACTORY_ABI, FACTORY_ADDRESS)

      try {
        await window.ethereum.request({ method: "eth_requestAccounts" })
        const walletAddress = sessionStorage.getItem("wallet_address");
        const addresses: string[] = await factory.methods.getCampaignsForVoter(walletAddress).call()

        const campaignDetails: Campaign[] = await Promise.all(
          addresses.map(async (address, index) => {
            const campaignContract = new web3.eth.Contract(CAMPAIGN_ABI, address)
            const [
              title,
              description,
              totalVotes,
              startTimestamp,
              durationMinutes
            ] = await Promise.all([
              campaignContract.methods.getCampaignName().call(),
              campaignContract.methods.getCampaignDescription().call(),
              campaignContract.methods.getVotersCount().call(),
              campaignContract.methods.getStartTime().call(),
              campaignContract.methods.getCampaignDuration().call(),
            ])

            const startDate = new Date(Number(startTimestamp) * 1000)
            const endDate = new Date(startDate.getTime() + Number(durationMinutes) * 60000)

            const now = new Date()
            let status: Campaign["status"] = "upcoming"
            if (now >= startDate && now <= endDate) status = "active"
            else if (now > endDate) status = "completed"

            return {
              id: address,
              title: String(title || ''),
              description: String(description || ''),
              totalVotes: Number(totalVotes),
              status,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            }
          })
        )

        setCampaigns(campaignDetails)
      } catch (err) {
        console.error("Error fetching campaigns:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

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

  return (
    <div className="min-h-screen bg-slate-900">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8 max-w-screen-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Campaigns</h1>
            <p className="text-slate-400">View and participate in active voting campaigns</p>
          </div>
          <Link href="/campaigns/create" className="mt-4 md:mt-0">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
        </div>
        {/*Filter campaigns by name, start date, and end date*/}
        <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4 p-1">
          <div className="flex-1">
            <label className="block text-slate-400 mb-1 text-sm" htmlFor="search">
              Campaign Name
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by name..."
              className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-sm" htmlFor="start-date">
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              className="px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={startDateFilter}
              onChange={e => setStartDateFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 text-sm" htmlFor="end-date">
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              className="px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={endDateFilter}
              onChange={e => setEndDateFilter(e.target.value)}
            />
          </div>
        </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCampaigns.map((campaign) => (
                  <Card key={campaign.id} className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl font-bold text-white">{campaign.title}</CardTitle>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription className="text-slate-400">{campaign.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-slate-400">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{campaign.totalVotes} votes cast</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            {new Date(campaign.startDate).toLocaleDateString()} -{" "}
                            {new Date(campaign.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      {campaign.status === "active" ? (
                        <Link href={`/campaigns/${campaign.id}`} className="w-full">
                          <Button className="w-full bg-orange-500 hover:bg-orange-600">Vote Now</Button>
                        </Link>
                      ) : campaign.status === "completed" ? (
                        <Link href={`/campaigns/${campaign.id}`} className="w-full">
                          <Button
                            variant="outline"
                            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 mt-auto"
                          >
                            <BarChart className="h-4 w-4 mr-2" />
                            View Results
                          </Button>
                        </Link>
                      ) : (
                        <Button disabled className="w-full bg-slate-700 text-slate-400 cursor-not-allowed">
                          Coming Soon
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

      </main>
    </div>
  )
}
