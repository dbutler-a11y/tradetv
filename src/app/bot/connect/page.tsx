"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Shield,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export default function ConnectBrokerPage() {
  const [environment, setEnvironment] = useState<"demo" | "live">("demo");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [errorMessage, setErrorMessage] = useState("");

  const handleConnect = async () => {
    setStatus("connecting");
    setErrorMessage("");

    // Simulate connection attempt
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // For demo, simulate success or failure based on whether credentials are filled
    if (username && password && clientId) {
      setStatus("connected");
    } else {
      setStatus("error");
      setErrorMessage("Please fill in all required fields.");
    }
  };

  const handleDisconnect = () => {
    setStatus("disconnected");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/bot">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Connect Broker</h1>
          <p className="text-muted-foreground">
            Connect your Tradovate account to execute trades automatically.
          </p>
        </div>
      </div>

      {/* Connection Status */}
      {status === "connected" && (
        <Alert className="mb-6 border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Connected</AlertTitle>
          <AlertDescription>
            Your Tradovate {environment} account is connected and ready to trade.
          </AlertDescription>
        </Alert>
      )}

      {status === "error" && (
        <Alert className="mb-6 border-red-500/50 bg-red-500/10" variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Connection Failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Environment Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Trading Environment
            </CardTitle>
            <CardDescription>
              Choose whether to trade on demo or live account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={environment}
              onValueChange={(v) => setEnvironment(v as "demo" | "live")}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:border-primary cursor-pointer">
                <RadioGroupItem value="demo" id="demo" />
                <div className="flex-1">
                  <Label htmlFor="demo" className="font-medium cursor-pointer">
                    Demo Account
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Practice with simulated funds. No real money at risk.
                  </p>
                </div>
                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                  Recommended
                </span>
              </div>
              <div className="flex items-center space-x-2 p-4 rounded-lg border hover:border-primary cursor-pointer">
                <RadioGroupItem value="live" id="live" />
                <div className="flex-1">
                  <Label htmlFor="live" className="font-medium cursor-pointer">
                    Live Account
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Trade with real money. Use caution.
                  </p>
                </div>
                <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded">
                  Real Money
                </span>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="w-5 h-5" />
              Tradovate Credentials
            </CardTitle>
            <CardDescription>
              Enter your Tradovate API credentials.{" "}
              <a
                href="https://trader.tradovate.com/#/settings/api-access"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Get API keys <ExternalLink className="w-3 h-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Your Tradovate username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={status === "connected"}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your Tradovate password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === "connected"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Client ID */}
            <div className="space-y-2">
              <Label htmlFor="clientId">API Client ID</Label>
              <Input
                id="clientId"
                placeholder="Your API client ID"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={status === "connected"}
              />
            </div>

            {/* Client Secret */}
            <div className="space-y-2">
              <Label htmlFor="clientSecret">API Client Secret</Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showSecret ? "text" : "password"}
                  placeholder="Your API client secret"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  disabled={status === "connected"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Device ID */}
            <div className="space-y-2">
              <Label htmlFor="deviceId">Device ID (Optional)</Label>
              <Input
                id="deviceId"
                placeholder="Unique device identifier"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                disabled={status === "connected"}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to auto-generate.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Your credentials are secure</AlertTitle>
          <AlertDescription>
            Your API credentials are encrypted and stored securely. We never store
            your Tradovate password—only the authentication tokens required for
            trading.
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/bot">Cancel</Link>
          </Button>
          {status === "connected" ? (
            <Button variant="destructive" onClick={handleDisconnect}>
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={status === "connecting"}
              className="gap-2"
            >
              {status === "connecting" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Account"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
