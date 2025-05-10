"use client"

import Image from "next/image"

export function MetaMaskConnector() {
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <div className="w-20 h-20 relative">
        <Image
          src="/metamask.png?height=80&width=80"
          alt="MetaMask Fox"
          width={80}
          height={80}
        />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white">Connect with MetaMask</h3>
        <p className="text-sm text-slate-400 mt-1">Connect your wallet to authenticate and participate in voting</p>
      </div>
    </div>
  )
}
