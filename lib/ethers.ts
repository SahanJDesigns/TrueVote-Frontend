import { ethers } from "ethers";

export const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    return provider;
  }
  throw new Error("Metamask not found");
};

export const getSigner = async () => {
  const provider = getProvider();
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
};
