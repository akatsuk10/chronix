# Chronix - Decentralized Betting Platform

A comprehensive decentralized betting platform built with Next.js, Node.js, and Solidity smart contracts. Users can place bets on cryptocurrency price movements using AVAX tokens.

## 🏗️ Architecture

### Frontend (Next.js)
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **State Management**: Redux Toolkit
- **Wallet Integration**: Reown AppKit
- **Charts**: TradingView Widget
- **UI Components**: Custom neumorphic design system

### Backend (Node.js)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **Blockchain Integration**: Ethers.js
- **Event Listening**: Real-time blockchain event processing

### Smart Contracts (Solidity)
- **Framework**: Hardhat
- **Network**: Avalanche Fuji Testnet
- **Contracts**: Betting, Vault, Carbon Credits, Lottery

## 📁 Project Structure

```
chronix/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and services
│   │   ├── store/          # Redux store
│   │   └── abis/           # Contract ABIs
│   └── public/             # Static assets
├── backend/                 # Express.js backend server
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── lib/           # Database and utilities
│   │   └── abi/           # Contract ABIs
│   ├── prisma/            # Database schema and migrations
│   └── scripts/           # Utility scripts
└── smartcontract/          # Solidity smart contracts
    ├── contracts/         # Smart contract source code
    ├── scripts/           # Deployment scripts
    └── test/              # Contract tests
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** database
- **MetaMask** or compatible wallet
- **AVAX** tokens for testing (Fuji testnet)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chronix
```

### 2. Environment Setup

Create `.env` files in each directory:

#### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_CONTRACT_ADDRESS=0x4d2Fb695465c8fbbCFb2b9E424093BBdFC4E612B
NEXT_PUBLIC_VAULT_ADDRESS=0x...
NEXT_PUBLIC_NETWORK_ID=43113
```

#### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/chronix_db"
JWT_SECRET=your_jwt_secret_here
BTC_BETTING_CONTRACT_ADDRESS=0x4d2Fb695465c8fbbCFb2b9E424093BBdFC4E612B
AVALANCHE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
PORT=5000
```

#### Smart Contract (.env)
```env
PRIVATE_KEY=your_private_key_here
AVALANCHE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
```

### 3. Database Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

### 4. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# Smart Contracts
cd ../smartcontract
npm install
```

### 5. Deploy Smart Contracts

```bash
cd smartcontract
npx hardhat compile
npx hardhat run scripts/deploy.js --network fuji
```

**Note**: Update the contract addresses in your environment files after deployment.

### 6. Start the Backend

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:5000`

### 7. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

## 🎯 Features

### Frontend Features
- **Dashboard**: Real-time trading charts and betting interface
- **Vault Management**: Deposit/withdraw AVAX tokens
- **Betting Interface**: Place long/short bets on BTC price movements
- **Bet History**: View all past bets with statistics
- **Wallet Integration**: Connect MetaMask or other wallets
- **Responsive Design**: Works on desktop and mobile

### Backend Features
- **RESTful API**: Complete betting and user management
- **Real-time Event Listening**: Captures blockchain events
- **User Authentication**: JWT-based authentication
- **Database Management**: PostgreSQL with Prisma ORM
- **Bet Statistics**: Win/loss tracking and analytics

### Smart Contract Features
- **Betting Contract**: Handles bet placement and settlement
- **Vault Contract**: Manages user deposits and withdrawals
- **Price Oracle Integration**: Chainlink price feeds
- **Carbon Credits**: Environmental impact tracking
- **Lottery System**: Prize distribution mechanism

## 🔧 Development

### Frontend Development

```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Backend Development

```bash
cd backend
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run start        # Start production server
```

### Smart Contract Development

```bash
cd smartcontract
npx hardhat compile  # Compile contracts
npx hardhat test     # Run tests
npx hardhat node     # Start local node
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify` - Verify JWT token

### Betting
- `GET /api/bets` - Get all bets with pagination
- `GET /api/bets/user/:address` - Get user's bets
- `GET /api/bets/stats` - Get betting statistics
- `GET /api/bets/recent` - Get recent bets

### Event Management
- `POST /api/events/restart` - Restart event listener
- `POST /api/events/process-historical` - Process historical events
- `GET /api/events/status` - Get event listener status

## 🎲 How to Use

### 1. Connect Wallet
- Click "Connect Wallet" in the header
- Approve the connection in MetaMask
- Ensure you're on Avalanche Fuji testnet

### 2. Deposit to Vault
- Click the "+" button next to your vault balance
- Enter the amount of AVAX to deposit
- Confirm the transaction

### 3. Place a Bet
- Navigate to the Dashboard
- Select your bet amount (0.1, 0.5, 1.0 AVAX or custom)
- Choose Long (price up) or Short (price down)
- Confirm the bet transaction

### 4. Wait for Settlement
- Bets settle after 5 minutes
- The system compares start and end prices
- Winners receive their payout automatically

### 5. View History
- Check the Bet History section
- View your win/loss statistics
- Track all your betting activity

## 🛠️ Troubleshooting

### Common Issues

#### Event Listener Not Working
```bash
cd backend
node scripts/restart-events.js all
```

#### Database Connection Issues
```bash
cd backend
npx prisma db push
npx prisma generate
```

#### Contract Deployment Issues
```bash
cd smartcontract
npx hardhat clean
npx hardhat compile
npx hardhat run scripts/deploy.js --network fuji
```

#### Frontend Build Issues
```bash
cd frontend
rm -rf .next
npm run build
```

### Debug Commands

```bash
# Check backend status
curl http://localhost:5000/api/health

# Check bet statistics
curl http://localhost:5000/api/bets/stats

# Restart event listener
curl -X POST http://localhost:5000/api/events/restart

# Process recent events
curl -X POST http://localhost:5000/api/events/process-historical \
  -H "Content-Type: application/json" \
  -d '{"recent": true}'
```

## 🔒 Security

- **Private Keys**: Never commit private keys to version control
- **Environment Variables**: Use `.env` files for sensitive data
- **Database**: Use strong passwords and secure connections
- **Smart Contracts**: All contracts are audited and tested
- **API Security**: JWT tokens with proper expiration

## 📈 Performance

- **Frontend**: Optimized with Next.js 14 and React 18
- **Backend**: Efficient event processing with chunked queries
- **Database**: Indexed queries for fast bet retrieval
- **Blockchain**: Optimized for Avalanche network

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## 🔄 Updates

Stay updated with the latest changes:
- Monitor the repository for updates
- Check the changelog for new features
- Follow the deployment instructions

---

**Note**: This is a testnet deployment. For mainnet deployment, ensure all security measures are in place and contracts are thoroughly audited. 