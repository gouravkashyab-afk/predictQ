/**
 * Agent Insights Display - Cobot-style information panel
 * Shows real-time agent analysis, signals, and trading decisions
 */

'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp, TrendingDown, Activity, Target, Zap } from 'lucide-react';

interface AlloraPrediction {
  asset: string;
  price: number;
  confidence: number;
  range: { min: number; max: number };
}

interface Signal {
  id: string;
  question: string;
  direction: 'YES' | 'NO';
  confidence: number;
  reasoning: string;
  source: 'gpt4o' | 'allora' | 'hybrid';
  metadata?: {
    ev?: number;
    edge?: number;
    sentiment?: string;
    technicalSignal?: string;
    alloraPrediction?: number;
    asset?: string;
    probability?: number;
  };
  createdAt: string;
}

interface AgentTrade {
  id: string;
  question: string;
  direction: 'YES' | 'NO';
  amountUsdc: number;
  confidence: number;
  status: string;
  createdAt: string;
}

interface AgentInsightsProps {
  agentId?: string;
}

export function AgentInsights({ agentId }: AgentInsightsProps) {
  const [predictions, setPredictions] = useState<{
    btc: AlloraPrediction;
    eth: AlloraPrediction;
  } | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [recentTrades, setRecentTrades] = useState<AgentTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentData();
    const interval = setInterval(fetchAgentData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [agentId]);

  async function fetchAgentData() {
    try {
      // Fetch Allora predictions
      const predRes = await fetch('/api/allora/test');
      if (predRes.ok) {
        const predData = await predRes.json();
        if (predData.success) {
          setPredictions(predData.data.predictions);
        }
      }

      // Fetch recent signals
      const sigRes = await fetch('/api/signals');
      if (sigRes.ok) {
        const sigData = await sigRes.json();
        if (sigData.success) {
          setSignals(sigData.data.slice(0, 5)); // Top 5 signals
        }
      }

      // Fetch recent agent trades if agentId provided
      if (agentId) {
        const tradesRes = await fetch(`/api/agents/${agentId}/trades`);
        if (tradesRes.ok) {
          const tradesData = await tradesRes.json();
          setRecentTrades(tradesData.data?.slice(0, 5) || []);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching agent data:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Agent Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading insights...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Allora Network Predictions - Like Cobot's AI Signals */}
      {predictions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              Allora Network Intelligence
              <Badge variant="outline" className="ml-auto">
                100+ ML Models
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Decentralized predictions from competing AI models, weighted by accuracy
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* BTC Prediction */}
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">BTC (8h)</span>
                  <Badge variant="secondary">{predictions.btc.confidence}% confidence</Badge>
                </div>
                <div className="text-2xl font-bold">${predictions.btc.price.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  Range: ${predictions.btc.range.min.toLocaleString()} - $
                  {predictions.btc.range.max.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full"
                      style={{ width: `${predictions.btc.confidence}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* ETH Prediction */}
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">ETH (8h)</span>
                  <Badge variant="secondary">{predictions.eth.confidence}% confidence</Badge>
                </div>
                <div className="text-2xl font-bold">${predictions.eth.price.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  Range: ${predictions.eth.range.min.toLocaleString()} - $
                  {predictions.eth.range.max.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full"
                      style={{ width: `${predictions.eth.confidence}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Signals - Like Cobot's Signal Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Active Signals
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            AI-generated trading opportunities across prediction markets
          </p>
        </CardHeader>
        <CardContent>
          {signals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active signals. Generate signals from Allora or GPT-4o.
            </div>
          ) : (
            <div className="space-y-3">
              {signals.map((signal) => (
                <div
                  key={signal.id}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Question */}
                      <div className="font-medium">{signal.question}</div>

                      {/* Source Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={
                            signal.source === 'allora'
                              ? 'default'
                              : signal.source === 'hybrid'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {signal.source === 'allora' && <Zap className="w-3 h-3 mr-1" />}
                          {signal.source === 'allora'
                            ? 'Allora Network'
                            : signal.source === 'hybrid'
                            ? 'Hybrid AI'
                            : 'GPT-4o'}
                        </Badge>

                        {/* Direction */}
                        <Badge variant={signal.direction === 'YES' ? 'default' : 'destructive'}>
                          {signal.direction === 'YES' ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {signal.direction}
                        </Badge>

                        {/* Confidence */}
                        <Badge variant="outline">{signal.confidence}% confidence</Badge>

                        {/* EV */}
                        {signal.metadata?.ev !== undefined && (
                          <Badge
                            variant={signal.metadata.ev > 10 ? 'default' : 'secondary'}
                            className="bg-green-500/10 text-green-600 border-green-500/20"
                          >
                            +{signal.metadata.ev.toFixed(1)}% EV
                          </Badge>
                        )}

                        {/* Edge */}
                        {signal.metadata?.edge !== undefined && (
                          <Badge variant="secondary">{signal.metadata.edge.toFixed(1)}% edge</Badge>
                        )}

                        {/* Technical Signal */}
                        {signal.metadata?.technicalSignal && (
                          <Badge variant="outline">{signal.metadata.technicalSignal}</Badge>
                        )}
                      </div>

                      {/* Allora Prediction Details */}
                      {signal.source === 'allora' && signal.metadata?.alloraPrediction && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">{signal.metadata.asset}</span> prediction: $
                          {signal.metadata.alloraPrediction.toFixed(2)} • Probability:{' '}
                          {((signal.metadata.probability || 0) * 100).toFixed(1)}%
                        </div>
                      )}

                      {/* Reasoning */}
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {signal.reasoning}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(signal.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Agent Activity - Like Cobot's Trade History */}
      {agentId && recentTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Recent Agent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTrades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium">{trade.question}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant={trade.direction === 'YES' ? 'default' : 'destructive'} className="text-xs">
                        {trade.direction}
                      </Badge>
                      <span className="text-xs text-muted-foreground">${trade.amountUsdc}</span>
                      <Badge variant="outline" className="text-xs">{trade.confidence}%</Badge>
                      <Badge variant="secondary" className="text-xs">{trade.status}</Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(trade.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
