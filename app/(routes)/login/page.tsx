"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MetaMaskConnector } from "@/components/metamask-connector"
import Web3 from "web3"
import { ModeToggle } from "@/components/mode-toggle"


export default function LoginPage() {
  const router = useRouter()  
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [account, setAccount] = useState<string | null>(null)

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed")
      }
      
      const web3 = new Web3(window.ethereum);

      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" })
      const accounts = await web3.eth.getAccounts();

      if (accounts.length === 0) {
        throw new Error("No accounts found")
      }

      // check if the given address is reistered
      const result = await fetch('http://localhost:8000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: accounts[0] }),
        credentials: 'include',
      });

      const data = await result.json()
      if (result.status === 404) {
        throw new Error("You are not registered. Please register first.")
      }
      if (result.ok) {
        setAccount(accounts[0])
      }
    
      sessionStorage.setItem("wallet_address", accounts[0]);
      document.cookie = `wallet_address=${accounts[0]}; path=/;`;
      sessionStorage.setItem("user_firstname", data.first_name)
      sessionStorage.setItem("user_lastname", data.last_name)
      sessionStorage.setItem("user_email", data.email)

      router.push("/campaigns")

    } catch (err: any) {
      setError(err.message || "Failed to connect to MetaMask")
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-secondary-foreground flex flex-col items-center justify-center p-4">
       {/* Move ModeToggle to top-left */}
    <div className="absolute top-4 left-4 z-50">
      <ModeToggle />
    </div>
      <div className="max-w-md w-full">
        <Card className="border-slate-700 bg-card backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">Login with MetaMask</CardTitle>
            <CardDescription className="text-foreground">
              Connect your wallet to access the voting platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {account ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-foreground">Connected as:</p>
                  <p className="text-sm font-mono text-orange-400 truncate">{account}</p>
                  <p className="text-sm text-foreground mt-2">Verifying your account...</p>
                </div>
              </div>
            ) : (
              <MetaMaskConnector />
            )}
          </CardContent>
          <CardFooter>
            {!account && (
              <Button
                className="w-full bg-destructive hover:bg-destructive-foreground"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
