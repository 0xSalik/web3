"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  Wallet,
  Coins,
  BarChart3,
  Zap,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Copy,
  ExternalLink,
} from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchTokenData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/web3", {
        method: "GET",
        cache: "no-store", // Ensure fresh data
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: TokenData = await response.json();
      setTokenData(data);
      setLastUpdated(new Date(data.lastUpdated));
    } catch (error) {
      console.error("Error fetching token data:", error);
      // Fallback to mock data if API fails
      const mockData: TokenData = {
        currentIndex: Math.floor(Math.random() * 1000000) + 500000,
        availableTokens: Math.floor(Math.random() * 10000) + 5000,
        tokenValue: Number.parseFloat((Math.random() * 2 + 0.5).toFixed(4)),
        solanaPrice: Number.parseFloat((Math.random() * 50 + 100).toFixed(2)),
        totalValue: 0,
        priceChange24h: Number.parseFloat((Math.random() * 20 - 10).toFixed(2)),
        volume24h: Math.floor(Math.random() * 1000000) + 500000,
        marketCap: Math.floor(Math.random() * 10000000) + 5000000,
        lastUpdated: new Date().toISOString(),
      };
      mockData.totalValue = Number.parseFloat(
        (
          mockData.availableTokens *
          mockData.tokenValue *
          mockData.solanaPrice
        ).toFixed(2)
      );
      setTokenData(mockData);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenData();
    const interval = setInterval(fetchTokenData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchTokenData();
    const interval = setInterval(fetchTokenData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + "K";
    }
    return num.toLocaleString();
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
                <h1 className="text-xl font-bold text-white">TokenVault</h1>
                <p className="text-sm text-gray-400">
                  Solana-Pegged Token Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="border-green-500/50 text-green-400 bg-green-500/10"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Live
              </Badge>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Current Index
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">
                {isLoading ? (
                  <div className="w-20 h-6 bg-gray-600 rounded animate-pulse"></div>
                ) : (
                  formatNumber(tokenData.currentIndex)
                )}
              </div>
              <p className="text-xs text-gray-400">Token Position</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Available Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">
                {isLoading ? (
                  <div className="w-20 h-6 bg-gray-600 rounded animate-pulse"></div>
                ) : (
                  formatNumber(tokenData.availableTokens)
                )}
              </div>
              <p className="text-xs text-gray-400">In Your Vault</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Token Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">
                {isLoading ? (
                  <div className="w-20 h-6 bg-gray-600 rounded animate-pulse"></div>
                ) : (
                  `$${tokenData.tokenValue}`
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
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">
                {isLoading ? (
                  <div className="w-20 h-6 bg-gray-600 rounded animate-pulse"></div>
                ) : (
                  `$${formatNumber(tokenData.totalValue)}`
                )}
              </div>
              <p className="text-xs text-gray-400">USD Equivalent</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Token Details */}
          <Card className="lg:col-span-2 bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  TokenVault (TVT)
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchTokenData}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-white"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Price Chart Placeholder */}
              <div className="h-48 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center border border-white/10">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Price Chart</p>
                  <p className="text-gray-500 text-xs">
                    Real-time data visualization
                  </p>
                </div>
              </div>

              {/* Token Metrics */}
              <div className="grid grid-cols-2 gap-4">
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
            </CardContent>
          </Card>

          {/* Solana Integration */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500"></div>
                Solana Peg
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-400">SOL Price</p>
                <p className="text-xl font-bold text-white">
                  ${tokenData.solanaPrice}
                </p>
              </div>

              <Separator className="bg-white/10" />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Peg Ratio</span>
                  <span className="text-sm text-white">1:1</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Stability</span>
                  <Badge
                    variant="outline"
                    className="border-green-500/50 text-green-400 bg-green-500/10"
                  >
                    Stable
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Last Sync</span>
                  <span className="text-sm text-white">
                    {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Solscan
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-16 bg-white/5 border border-white/10 hover:bg-white/10 text-white justify-start">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mr-3">
                <Coins className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-medium">Stake Tokens</p>
                <p className="text-sm text-gray-400">Earn rewards</p>
              </div>
            </Button>

            <Button className="h-16 bg-white/5 border border-white/10 hover:bg-white/10 text-white justify-start">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center mr-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-medium">Trade</p>
                <p className="text-sm text-gray-400">Buy/Sell tokens</p>
              </div>
            </Button>

            <Button className="h-16 bg-white/5 border border-white/10 hover:bg-white/10 text-white justify-start">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mr-3">
                <Copy className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-medium">Portfolio</p>
                <p className="text-sm text-gray-400">View holdings</p>
              </div>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
