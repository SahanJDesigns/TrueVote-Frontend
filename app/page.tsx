import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white">Decentralized Voting</CardTitle>
            <CardDescription className="text-slate-300">
              Secure, transparent, and verifiable voting platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300 text-center">
              Connect with MetaMask to access the platform and participate in campaigns.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Link href="/login" className="w-full">
              <Button className="w-full bg-orange-500 hover:bg-orange-600">Login with MetaMask</Button>
            </Link>
            <Link href="/register" className="w-full">
              <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                Register New Account
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
