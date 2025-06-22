"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Coins,
  Zap,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ExternalLink,
  Wallet,
  Copy,
  CheckCircle,
  AlertCircle,
  Send,
} from "lucide-react";
import Link from "next/link";

interface TokenStats {
  availableTokens: number;
  onChainBalance: number;
  totalClaimed: number;
  walletLinked: boolean;
  walletAddress?: string;
  canClaim: boolean;
  lastClaim?: string;
  tokenValue: number;
  lastUpdated: string;
}

interface TokenData {
  currentIndex: number;
  availableTokens: number;
  tokenValue: number;
  solanaPrice: number;
  totalValue: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
}

export default function Home() {
  const [tokenData, setTokenData] = useState<TokenData>({
    currentIndex: 0,
    availableTokens: 0,
    tokenValue: 0,
    solanaPrice: 0,
    totalValue: 0,
    priceChange24h: 0,
    volume24h: 0,
    marketCap: 0,
    lastUpdated: new Date().toISOString(),
  });

  const [tokenStats, setTokenStats] = useState<TokenStats>({
    availableTokens: 0,
    onChainBalance: 0,
    totalClaimed: 0,
    walletLinked: false,
    canClaim: false,
    tokenValue: 0,
    lastUpdated: new Date().toISOString(),
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [walletInput, setWalletInput] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [copied, setCopied] = useState(false);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchTokenStats = async () => {
    try {
      const response = await fetch("/api/tokens/stats", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Stats API error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setTokenStats(result.data);
        // Update tokenData with stats data
        setTokenData((prev) => ({
          ...prev,
          availableTokens: result.data.availableTokens,
          tokenValue: result.data.tokenValue,
          totalValue: result.data.onChainBalance * result.data.tokenValue,
          lastUpdated: result.data.lastUpdated,
        }));
        setLastUpdated(new Date(result.data.lastUpdated));
      }
    } catch (error) {
      console.error("Error fetching token stats:", error);
    }
  };

  const fetchTokenData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch both stats and legacy data
      await fetchTokenStats();

      // If we need additional market data, fetch from web3 endpoint
      const response = await fetch("/api/web3", {
        method: "GET",
        cache: "no-store",
      });

      if (response.ok) {
        const data: TokenData = await response.json();
        setTokenData((prev) => ({
          ...data,
          availableTokens: prev.availableTokens,
          tokenValue: prev.tokenValue,
          totalValue: prev.totalValue,
        }));
      }
    } catch (error) {
      console.error("Error fetching token data:", error);
      // Fallback to mock data if API fails
      const mockData: TokenData = {
        currentIndex: Math.floor(Math.random() * 1000000) + 500000,
        availableTokens:
          tokenStats.availableTokens ||
          Math.floor(Math.random() * 10000) + 5000,
        tokenValue:
          tokenStats.tokenValue ||
          Number.parseFloat((Math.random() * 2 + 0.5).toFixed(4)),
        solanaPrice: Number.parseFloat((Math.random() * 50 + 100).toFixed(2)),
        totalValue: 0,
        priceChange24h: Number.parseFloat((Math.random() * 20 - 10).toFixed(2)),
        volume24h: Math.floor(Math.random() * 1000000) + 500000,
        marketCap: Math.floor(Math.random() * 10000000) + 5000000,
        lastUpdated: new Date().toISOString(),
      };
      mockData.totalValue = Number.parseFloat(
        (
          tokenStats.onChainBalance *
          mockData.tokenValue *
          mockData.solanaPrice
        ).toFixed(2)
      );
      setTokenData(mockData);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const linkWallet = async () => {
    if (!walletInput.trim()) {
      showNotification("error", "Please enter a wallet address");
      return;
    }

    setIsLinking(true);
    try {
      const response = await fetch("/api/wallet/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: walletInput.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        showNotification("success", "Wallet linked successfully!");
        setWalletInput("");
        await fetchTokenStats(); // Refresh stats
      } else {
        showNotification("error", result.error || "Failed to link wallet");
      }
    } catch (error) {
      showNotification("error", "Error linking wallet");
      console.error("Error linking wallet:", error);
    } finally {
      setIsLinking(false);
    }
  };

  const claimTokens = async () => {
    setIsClaiming(true);
    try {
      const response = await fetch("/api/tokens/claim", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        showNotification(
          "success",
          `Tokens claimed! Transaction: ${result.signature?.slice(0, 8)}...`
        );
        await fetchTokenStats(); // Refresh stats
      } else {
        showNotification("error", result.error || "Failed to claim tokens");
      }
    } catch (error) {
      showNotification("error", "Error claiming tokens");
      console.error("Error claiming tokens:", error);
    } finally {
      setIsClaiming(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  useEffect(() => {
    fetchTokenData();
    const interval = setInterval(fetchTokenData, 30000);
    return () => clearInterval(interval);
  }, [fetchTokenData]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + "K";
    }
    return num.toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0"></div>

      <header className="relative z-10 border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">EcoRewards</h1>
                <p className="text-sm text-gray-400">
                  Turn trash into digital cash!
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`p-4 rounded-lg backdrop-blur-sm border ${
              notification.type === "success"
                ? "border-green-500/50 text-green-400 bg-green-500/10"
                : "border-red-500/50 text-red-400 bg-red-500/10"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Wallet Connection Section */}
        {!tokenStats.walletLinked && (
          <div className="mb-8 bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-white" />
                <h2 className="text-lg font-semibold text-white">
                  Connect Your Solana Wallet
                </h2>
              </div>
              <p className="text-gray-300 mb-4">
                Link your Solana wallet to claim your EcoReward tokens on-chain.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter your Solana wallet address"
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={linkWallet}
                  disabled={isLinking}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isLinking ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      Link Wallet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Coins className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-400">
                Available Tokens
              </h3>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {isLoading ? (
                <div className="w-20 h-6 bg-gray-600 rounded animate-pulse"></div>
              ) : (
                formatNumber(tokenStats.availableTokens)
              )}
            </div>
            <p className="text-xs text-gray-400">Ready to Claim</p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-400">
                On-Chain Balance
              </h3>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {isLoading ? (
                <div className="w-20 h-6 bg-gray-600 rounded animate-pulse"></div>
              ) : (
                formatNumber(tokenStats.onChainBalance)
              )}
            </div>
            <p className="text-xs text-gray-400">TVT Tokens</p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-400">Token Value</h3>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {isLoading ? (
                <div className="w-20 h-6 bg-gray-600 rounded animate-pulse"></div>
              ) : (
                `${tokenStats.tokenValue}`
              )}
            </div>
            <div className="flex items-center gap-1">
              {tokenData.priceChange24h >= 0 ? (
                <ArrowUpRight className="w-3 h-3 text-green-400" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-red-400" />
              )}
              <span
                className={`text-xs ${
                  tokenData.priceChange24h >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {Math.abs(tokenData.priceChange24h)}%
              </span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-400">Total Value</h3>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {isLoading ? (
                <div className="w-20 h-6 bg-gray-600 rounded animate-pulse"></div>
              ) : (
                `${formatNumber(
                  tokenStats.onChainBalance * tokenStats.tokenValue
                )}`
              )}
            </div>
            <p className="text-xs text-gray-400">USD Equivalent</p>
          </div>
        </div>

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Token Details */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    EcoRewards (TVT)
                  </h2>
                </div>
                <button
                  onClick={fetchTokenData}
                  disabled={isLoading}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Wallet Status */}
              {tokenStats.walletLinked && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">
                      Connected Wallet
                    </span>
                    <span className="px-2 py-1 text-xs rounded border border-green-500/50 text-green-400 bg-green-500/10">
                      Connected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono">
                      {formatAddress(tokenStats.walletAddress!)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(tokenStats.walletAddress!)}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      {copied ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Claim Section */}
              {tokenStats.walletLinked && tokenStats.canClaim && (
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold">
                        Claim Available Tokens
                      </h3>
                      <p className="text-sm text-gray-400">
                        {tokenStats.availableTokens} tokens ready to claim
                      </p>
                    </div>
                    <button
                      onClick={claimTokens}
                      disabled={isClaiming}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-md flex items-center gap-2 disabled:opacity-50"
                    >
                      {isClaiming ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Claim Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Token Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Total Claimed</p>
                  <p className="text-lg font-semibold text-white">
                    {formatNumber(tokenStats.totalClaimed)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Last Claim</p>
                  <p className="text-lg font-semibold text-white">
                    {tokenStats.lastClaim
                      ? new Date(tokenStats.lastClaim).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">24h Volume</p>
                  <p className="text-lg font-semibold text-white">
                    ${formatNumber(tokenData.volume24h)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Market Cap</p>
                  <p className="text-lg font-semibold text-white">
                    ${formatNumber(tokenData.marketCap)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Solana Integration */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500"></div>
                <h2 className="text-lg font-semibold text-white">
                  Solana Network
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-400">SOL Price</p>
                <p className="text-xl font-bold text-white">
                  ${tokenData.solanaPrice}
                </p>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Network</span>
                    <span className="px-2 py-1 text-xs rounded border border-orange-500/50 text-orange-400 bg-orange-500/10">
                      Devnet
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Peg Ratio</span>
                    <span className="text-sm text-white">1:1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Status</span>
                    <span className="px-2 py-1 text-xs rounded border border-green-500/50 text-green-400 bg-green-500/10">
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Last Sync</span>
                    <span className="text-sm text-white">
                      {lastUpdated.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
              <Link
                href="https://solscan.io/token/So11111111111111111111111111111111111111111"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="w-full py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-md flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  View on Solscan
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
