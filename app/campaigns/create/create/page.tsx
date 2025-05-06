"use client";

import { useState, useEffect } from "react";
import Web3 from "web3";
import { FACTORY_ABI, FACTORY_ADDRESS } from "@/lib/constants";

// No need to redeclare Window interface as it's already defined in global.d.ts

export default function CreateCampaign() {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [factory, setFactory] = useState<any>(null);
  const [account, setAccount] = useState("");

  const [candidateNames, setCandidateNames] = useState("");
  const [duration, setDuration] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [campaignDesc, setCampaignDesc] = useState("");
  const [startTime, setStartTime] = useState("");
  const [status, setStatus] = useState("");
  const [newCampaignAddress, setNewCampaignAddress] = useState("");

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

  const handleCreateCampaign = async () => {
    if (!factory) {
      alert("Smart contract not initialized yet.");
      return;
    }

    try {
      const candidateArray = candidateNames
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name !== "");

      if (candidateArray.length < 2) {
        alert("Enter at least two candidate names.");
        return;
      }

      const durationInMinutes = parseInt(duration);
      if (isNaN(durationInMinutes) || durationInMinutes <= 0) {
        alert("Duration must be a positive number.");
        return;
      }

      const startTimestamp = Math.floor(
        new Date(startTime).getTime() / 1000
      );
      if (isNaN(startTimestamp) || startTimestamp <= Date.now() / 1000) {
        alert("Start time must be in the future.");
        return;
      }

      setStatus("⏳ Creating campaign on blockchain...");
      console.log({
        candidateArray,
        durationInMinutes,
        campaignName,
        campaignDesc,
        startTimestamp,
        startTime,
      })
      const receipt = await factory.methods
        .createCampaign(
          candidateArray,
          durationInMinutes,
          campaignName,
          campaignDesc,
          startTimestamp,
          startTime // passing readable time for frontend display
        )
        .send({ from: account });

      const event = receipt.events?.CampaignCreated;
      if (event && event.returnValues?.campaignAddress) {
        const campaignAddress = event.returnValues.campaignAddress;
        setNewCampaignAddress(campaignAddress);
        setStatus(`✅ Campaign created successfully at: ${campaignAddress}`);
      } else {
        setStatus("⚠️ Campaign created, but no event log found.");
      }
    } catch (error: any) {
      console.error(error);
      setStatus(
        `❌ Failed to create campaign: ${
          error?.message || "Unknown blockchain error"
        }`
      );
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "auto" }}>
      <h1>Create Campaign</h1>
      <p>
        <strong>Connected Account:</strong> {account || "Not connected"}
      </p>

      <div>
        <label>Candidate Names (comma-separated):</label>
        <input
          value={candidateNames}
          onChange={(e) => setCandidateNames(e.target.value)}
          className="border p-2 w-full mb-3"
        />
      </div>

      <div>
        <label>Duration (in minutes):</label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="border p-2 w-full mb-3"
        />
      </div>

      <div>
        <label>Campaign Name:</label>
        <input
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          className="border p-2 w-full mb-3"
        />
      </div>

      <div>
        <label>Campaign Description:</label>
        <input
          value={campaignDesc}
          onChange={(e) => setCampaignDesc(e.target.value)}
          className="border p-2 w-full mb-3"
        />
      </div>

      <div>
        <label>Voting Start Time:</label>
        <input
          type="datetime-local"
          onChange={(e) => setStartTime(e.target.value)}
          className="border p-2 w-full mb-4"
        />
      </div>

      <button
        onClick={handleCreateCampaign}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Create Campaign
      </button>

      <p style={{ marginTop: "1rem" }}>{status}</p>

      {newCampaignAddress && (
        <div style={{ marginTop: "1rem" }}>
          <strong>New Campaign Address:</strong>
          <code>{newCampaignAddress}</code>
        </div>
      )}
    </div>
  );
}
