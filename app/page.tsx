import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ModeToggle } from "@/components/mode-toggle"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-secondary-foreground text-foreground flex flex-col items-center justify-center p-4 transition-colors">
      
       {/* Move ModeToggle to top-left */}
    <div className="absolute top-4 left-4 z-50">
      <ModeToggle />
    </div>

      <div className="max-w-md w-full">
        <Card className=" bg-card text-card-foreground border border-border shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Decentralized Voting</CardTitle>
            <CardDescription>
              Secure, transparent, and verifiable voting platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center">
              Connect with MetaMask to access the platform and participate in campaigns.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Link href="/login" className="w-full">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                Login with MetaMask
              </Button>
            </Link>
            <Link href="/register" className="w-full">
              <Button
                variant="outline"
                className="w-full border-border text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Register New Account
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
