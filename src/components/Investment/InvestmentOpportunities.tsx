"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Users, 
  Shield, 
  Star,
  Target,
  BarChart3,
  PieChart,
  Zap,
  Crown,
  Gem,
  Building,
  TreePine,
  Car,
  Home,
  Briefcase
} from "lucide-react";

interface Investment {
  id: string;
  name: string;
  description: string;
  category: 'agriculture' | 'real_estate' | 'tech' | 'manufacturing' | 'energy' | 'transport' | 'healthcare' | 'education';
  type: 'equity' | 'debt' | 'hybrid' | 'commodity';
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number; // Annual percentage
  minimumAmount: number; // in kobo
  maximumAmount: number; // in kobo
  duration: number; // in months
  currentInvestors: number;
  maxInvestors: number;
  totalRaised: number; // in kobo
  targetAmount: number; // in kobo
  status: 'open' | 'closed' | 'coming_soon';
  startDate: string;
  endDate: string;
  features: string[];
  risks: string[];
  returns: ReturnProjection[];
  company: {
    name: string;
    logo: string;
    rating: number;
    established: number;
    description: string;
  };
}

interface ReturnProjection {
  period: string;
  amount: number;
  percentage: number;
}

interface UserInvestment {
  id: string;
  investmentId: string;
  amount: number;
  investedAt: string;
  status: 'active' | 'completed' | 'cancelled';
  currentValue: number;
  returns: number;
}

const investmentCategories = [
  { value: 'agriculture', label: 'Agriculture', icon: TreePine, color: 'text-green-600' },
  { value: 'real_estate', label: 'Real Estate', icon: Home, color: 'text-blue-600' },
  { value: 'tech', label: 'Technology', icon: Zap, color: 'text-purple-600' },
  { value: 'manufacturing', label: 'Manufacturing', icon: Building, color: 'text-orange-600' },
  { value: 'energy', label: 'Energy', icon: Gem, color: 'text-yellow-600' },
  { value: 'transport', label: 'Transport', icon: Car, color: 'text-red-600' },
  { value: 'healthcare', label: 'Healthcare', icon: Shield, color: 'text-pink-600' },
  { value: 'education', label: 'Education', icon: Briefcase, color: 'text-indigo-600' }
];

const riskColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
};

const statusColors = {
  open: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  coming_soon: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
};

export function InvestmentOpportunities() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [showInvestDialog, setShowInvestDialog] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockInvestments: Investment[] = [
      {
        id: '1',
        name: 'Green Farm Initiative',
        description: 'Sustainable agriculture project focusing on organic farming and renewable energy',
        category: 'agriculture',
        type: 'equity',
        riskLevel: 'medium',
        expectedReturn: 18.5,
        minimumAmount: 100000, // ₦1,000
        maximumAmount: 5000000, // ₦50,000
        duration: 24,
        currentInvestors: 45,
        maxInvestors: 100,
        totalRaised: 25000000, // ₦250,000
        targetAmount: 50000000, // ₦500,000
        status: 'open',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        features: [
          'Monthly dividend payments',
          'Transparent reporting',
          'Insurance coverage',
          'Early exit option'
        ],
        risks: [
          'Weather dependency',
          'Market price fluctuations',
          'Regulatory changes'
        ],
        returns: [
          { period: '6 months', amount: 109250, percentage: 9.25 },
          { period: '12 months', amount: 118500, percentage: 18.5 },
          { period: '24 months', amount: 137000, percentage: 37.0 }
        ],
        company: {
          name: 'GreenFarm Ltd',
          logo: '',
          rating: 4.8,
          established: 2019,
          description: 'Leading sustainable agriculture company with 5+ years experience'
        }
      },
      {
        id: '2',
        name: 'Tech Startup Accelerator',
        description: 'Early-stage technology startup focusing on fintech solutions',
        category: 'tech',
        type: 'equity',
        riskLevel: 'high',
        expectedReturn: 35.0,
        minimumAmount: 500000, // ₦5,000
        maximumAmount: 10000000, // ₦100,000
        duration: 36,
        currentInvestors: 23,
        maxInvestors: 50,
        totalRaised: 15000000, // ₦150,000
        targetAmount: 30000000, // ₦300,000
        status: 'open',
        startDate: '2024-02-01',
        endDate: '2024-11-30',
        features: [
          'High growth potential',
          'Expert mentorship',
          'Exit opportunities',
          'Regular updates'
        ],
        risks: [
          'High volatility',
          'Market competition',
          'Technology risks',
          'Regulatory uncertainty'
        ],
        returns: [
          { period: '12 months', amount: 135000, percentage: 35.0 },
          { period: '24 months', amount: 182250, percentage: 82.25 },
          { period: '36 months', amount: 246037, percentage: 146.04 }
        ],
        company: {
          name: 'TechVentures Inc',
          logo: '',
          rating: 4.6,
          established: 2020,
          description: 'Venture capital firm specializing in early-stage tech investments'
        }
      },
      {
        id: '3',
        name: 'Affordable Housing Project',
        description: 'Residential development project in Lagos providing affordable housing',
        category: 'real_estate',
        type: 'debt',
        riskLevel: 'low',
        expectedReturn: 12.0,
        minimumAmount: 200000, // ₦2,000
        maximumAmount: 20000000, // ₦200,000
        duration: 18,
        currentInvestors: 78,
        maxInvestors: 200,
        totalRaised: 40000000, // ₦400,000
        targetAmount: 80000000, // ₦800,000
        status: 'open',
        startDate: '2024-01-15',
        endDate: '2024-10-15',
        features: [
          'Fixed returns',
          'Property collateral',
          'Monthly payments',
          'Government backing'
        ],
        risks: [
          'Construction delays',
          'Market conditions',
          'Interest rate changes'
        ],
        returns: [
          { period: '6 months', amount: 106000, percentage: 6.0 },
          { period: '12 months', amount: 112000, percentage: 12.0 },
          { period: '18 months', amount: 118000, percentage: 18.0 }
        ],
        company: {
          name: 'Homes4All Ltd',
          logo: '',
          rating: 4.9,
          established: 2015,
          description: 'Established real estate developer with 8+ years of successful projects'
        }
      }
    ];

    setInvestments(mockInvestments);
    setLoading(false);
  }, []);

  const filteredInvestments = investments.filter(investment => {
    if (activeTab === 'all' && selectedCategory === 'all') return true;
    if (activeTab === 'my_investments') return userInvestments.some(ui => ui.investmentId === investment.id);
    if (activeTab === 'low_risk') return investment.riskLevel === 'low';
    if (activeTab === 'high_return') return investment.expectedReturn > 20;
    if (selectedCategory !== 'all') return investment.category === selectedCategory;
    return true;
  });

  const handleInvest = async () => {
    if (!selectedInvestment || !investAmount) return;

    const amount = parseFloat(investAmount) * 100; // Convert to kobo

    if (amount < selectedInvestment.minimumAmount) {
      toast.error(`Minimum investment is ₦${(selectedInvestment.minimumAmount / 100).toLocaleString()}`);
      return;
    }

    if (amount > selectedInvestment.maximumAmount) {
      toast.error(`Maximum investment is ₦${(selectedInvestment.maximumAmount / 100).toLocaleString()}`);
      return;
    }

    // Mock investment - replace with actual API call
    const newInvestment: UserInvestment = {
      id: Date.now().toString(),
      investmentId: selectedInvestment.id,
      amount,
      investedAt: new Date().toISOString(),
      status: 'active',
      currentValue: amount,
      returns: 0
    };

    setUserInvestments(prev => [...prev, newInvestment]);
    setShowInvestDialog(false);
    setInvestAmount('');
    setSelectedInvestment(null);

    toast.success(`Successfully invested ₦${(amount / 100).toLocaleString()} in ${selectedInvestment.name}`);
  };

  const getProgressPercentage = (investment: Investment) => {
    return (investment.totalRaised / investment.targetAmount) * 100;
  };

  const getCategoryIcon = (category: string) => {
    const cat = investmentCategories.find(c => c.value === category);
    return cat ? cat.icon : Building;
  };

  const getCategoryColor = (category: string) => {
    const cat = investmentCategories.find(c => c.value === category);
    return cat ? cat.color : 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Investment Opportunities</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Grow your money with curated investment options</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Portfolio</span>
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <PieChart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Analytics</span>
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-1 sm:gap-2 flex-wrap">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className="text-xs sm:text-sm"
        >
          All
        </Button>
        {investmentCategories.map(category => {
          const Icon = category.icon;
          return (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{category.label}</span>
              <span className="sm:hidden">{category.label.split(' ')[0]}</span>
            </Button>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
          <TabsTrigger value="my_investments" className="text-xs sm:text-sm">Portfolio</TabsTrigger>
          <TabsTrigger value="low_risk" className="text-xs sm:text-sm">Low Risk</TabsTrigger>
          <TabsTrigger value="high_return" className="text-xs sm:text-sm">High Returns</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredInvestments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No investments found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {activeTab === 'my_investments' 
                    ? 'You haven\'t made any investments yet'
                    : 'No investments match your current filters'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredInvestments.map((investment) => {
                const Icon = getCategoryIcon(investment.category);
                const categoryColor = getCategoryColor(investment.category);
                const userInvestment = userInvestments.find(ui => ui.investmentId === investment.id);

                return (
                  <motion.div
                    key={investment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800`}>
                              <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${categoryColor}`} />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base sm:text-lg">{investment.name}</CardTitle>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                {investment.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge className={`${riskColors[investment.riskLevel]} text-xs`}>
                                  {investment.riskLevel} risk
                                </Badge>
                                <Badge className={`${statusColors[investment.status]} text-xs`}>
                                  {investment.status}
                                </Badge>
                                {userInvestment && (
                                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs">
                                    Invested
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right sm:text-right">
                            <div className="text-xl sm:text-2xl font-bold text-green-600">
                              {investment.expectedReturn}%
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              Expected Return
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Funding Progress</span>
                            <span>{getProgressPercentage(investment).toFixed(1)}%</span>
                          </div>
                          <Progress value={getProgressPercentage(investment)} className="h-2" />
                          <div className="flex justify-between text-sm mt-2">
                            <span>₦{(investment.totalRaised / 100).toLocaleString()}</span>
                            <span>₦{(investment.targetAmount / 100).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Investment Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Minimum Investment</div>
                            <div className="font-semibold text-sm sm:text-base">₦{(investment.minimumAmount / 100).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Duration</div>
                            <div className="font-semibold text-sm sm:text-base">{investment.duration} months</div>
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Investors</div>
                            <div className="font-semibold text-sm sm:text-base">{investment.currentInvestors}/{investment.maxInvestors}</div>
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Company Rating</div>
                            <div className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                              <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                              {investment.company.rating}
                            </div>
                          </div>
                        </div>

                        {/* Features */}
                        <div>
                          <h4 className="font-medium mb-2">Key Features</h4>
                          <div className="flex flex-wrap gap-2">
                            {investment.features.map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          {investment.status === 'open' && !userInvestment && (
                            <Button
                              onClick={() => {
                                setSelectedInvestment(investment);
                                setShowInvestDialog(true);
                              }}
                              className="w-full sm:flex-1"
                            >
                              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              <span className="text-xs sm:text-sm">Invest Now</span>
                            </Button>
                          )}
                          {userInvestment && (
                            <Button variant="outline" className="w-full sm:flex-1">
                              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              <span className="text-xs sm:text-sm">View Details</span>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => setSelectedInvestment(investment)}
                            className="w-full sm:w-auto"
                          >
                            <span className="text-xs sm:text-sm">Learn More</span>
                          </Button>
                        </div>

                        {/* Investment Info */}
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Closes: {new Date(investment.endDate).toLocaleDateString()}</span>
                          <span>Est. {investment.company.established}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Investment Dialog */}
      <Dialog open={showInvestDialog} onOpenChange={setShowInvestDialog}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Invest in {selectedInvestment?.name}</DialogTitle>
          </DialogHeader>
          {selectedInvestment && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Expected Return</div>
                    <div className="font-semibold text-green-600">{selectedInvestment.expectedReturn}% p.a.</div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Duration</div>
                    <div className="font-semibold">{selectedInvestment.duration} months</div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Minimum</div>
                    <div className="font-semibold">₦{(selectedInvestment.minimumAmount / 100).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Maximum</div>
                    <div className="font-semibold">₦{(selectedInvestment.maximumAmount / 100).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="amount">Investment Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  placeholder="Enter amount"
                  min={selectedInvestment.minimumAmount / 100}
                  max={selectedInvestment.maximumAmount / 100}
                />
              </div>

              {investAmount && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Projected Returns</h4>
                  <div className="space-y-2 text-sm">
                    {selectedInvestment.returns.map((return_, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{return_.period}:</span>
                        <span className="font-semibold">
                          ₦{(parseFloat(investAmount) * return_.percentage / 100).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowInvestDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleInvest} className="flex-1">
                  Confirm Investment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
