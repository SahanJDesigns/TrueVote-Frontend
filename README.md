# TrueVote-Frontend

A decentralized voting platform built with Next.js and Ethereum blockchain technology.

## Overview

TrueVote is a secure, transparent, and verifiable voting platform powered by blockchain technology. The frontend is built using Next.js, and it interacts with smart contracts deployed on an Ethereum blockchain.

## Prerequisites

Before setting up this project, you need to have the following installed:

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) (v8 or later) or [yarn](https://yarnpkg.com/)
- [MetaMask](https://metamask.io/) browser extension
- [Ganache](https://trufflesuite.com/ganache/) for local blockchain development

## Setup Instructions

### 1. Clone the repositories

```bash
# Clone this frontend repository
git clone https://github.com/yourusername/TrueVote-Frontend.git
cd TrueVote-Frontend

# Clone the smart contracts repository
git clone https://github.com/DepartmentX/Solidity-Team.git ../Solidity-Team
```

### 2. Set up and deploy smart contracts

Follow the instructions in the [Solidity-Team README](https://github.com/DepartmentX/Solidity-Team) to:
1. Set up the Solidity development environment
2. Deploy the smart contracts to Ganache
3. Make note of the deployed contract addresses

### 3. Configure the frontend

1. Copy the contract ABIs from the Solidity-Team project:

```bash
# Make sure the ABIs directory exists
mkdir -p lib/abis

# Copy the ABI files (adjust paths if needed)
cp ../Solidity-Team/artifacts/contracts/Campaign.sol/Campaign.json lib/abis/
cp ../Solidity-Team/artifacts/contracts/CampaignFactory.sol/CampaignFactory.json lib/abis/
```

2. Update the contract addresses in the frontend:

Edit the `lib/constants.ts` file and update the `FACTORY_ADDRESS` value with the address of the deployed CampaignFactory contract from Ganache:

```typescript
export const FACTORY_ADDRESS = "YOUR_DEPLOYED_FACTORY_CONTRACT_ADDRESS";
```

### 4. Install dependencies

```bash
npm install
```

### 5. Download face detection models

The project uses face detection for biometric verification. Run the script to download the required models:

```bash
node scripts/download-models.js
```

## Running the Application

1. Make sure Ganache is running and your contracts are deployed with the same addresses you configured in `lib/constants.ts`.

2. Start the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to access the application.

4. Connect MetaMask to your Ganache blockchain:
   - Open MetaMask
   - Add a new network with:
     - Network Name: Ganache
     - New RPC URL: http://127.0.0.1:7545 (or your Ganache RPC URL)
     - Chain ID: 1337
     - Currency Symbol: ETH
   - Import a Ganache account using its private key

## Features

- Secure user authentication via MetaMask and face recognition
- Create and manage voting campaigns
- Participate in voting campaigns
- Real-time results and statistics
- Transparent voting records stored on the blockchain

## Development

The project is structured as follows:
- `app/`: Next.js app directory with pages and routes
- `components/`: React components for UI elements
- `hooks/`: Custom React hooks
- `lib/`: Utility functions and constants
- `public/`: Static assets and face detection models
- `scripts/`: Helper scripts
- `types/`: TypeScript type definitions

## License

[MIT](LICENSE)
