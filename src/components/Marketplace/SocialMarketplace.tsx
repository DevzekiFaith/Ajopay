"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  Heart, 
  MessageCircle, 
  Share2, 
  Star,
  MapPin,
  Clock,
  Shield,
  Package,
  DollarSign
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in kobo
  images: string[];
  category: 'electronics' | 'fashion' | 'home' | 'beauty' | 'sports' | 'books' | 'food' | 'services';
  condition: 'new' | 'like_new' | 'good' | 'fair';
  location: string;
  seller: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    verified: boolean;
    memberSince: string;
  };
  createdAt: string;
  status: 'available' | 'sold' | 'reserved';
  likes: number;
  views: number;
  tags: string[];
  shipping: {
    available: boolean;
    cost: number; // in kobo
    estimatedDays: number;
  };
  payment: {
    escrow: boolean;
    instant: boolean;
    methods: string[];
  };
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number; // in kobo
  images: string[];
  category: 'tutoring' | 'design' | 'writing' | 'photography' | 'consulting' | 'repair' | 'cleaning' | 'other';
  location: string;
  provider: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    verified: boolean;
    memberSince: string;
  };
  createdAt: string;
  status: 'available' | 'busy' | 'offline';
  likes: number;
  views: number;
  tags: string[];
  availability: {
    schedule: string;
    responseTime: string;
  };
  delivery: {
    online: boolean;
    inPerson: boolean;
    estimatedDays: number;
  };
}

const productCategories = [
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'fashion', label: 'Fashion', icon: '👗' },
  { value: 'home', label: 'Home & Garden', icon: '🏠' },
  { value: 'beauty', label: 'Beauty & Health', icon: '💄' },
  { value: 'sports', label: 'Sports & Fitness', icon: '⚽' },
  { value: 'books', label: 'Books & Media', icon: '📚' },
  { value: 'food', label: 'Food & Beverages', icon: '🍕' },
  { value: 'services', label: 'Services', icon: '🔧' }
];


export function SocialMarketplace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('products');
  const [showItemDialog, setShowItemDialog] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'iPhone 13 Pro Max',
        description: 'Excellent condition iPhone 13 Pro Max 256GB. No scratches, battery health 95%. Comes with original charger and box.',
        price: 45000000, // ₦450,000
        images: ['/api/placeholder/300/300'],
        category: 'electronics',
        condition: 'like_new',
        location: 'Lagos, Nigeria',
        seller: {
          id: '1',
          name: 'TechDeals Lagos',
          avatar: '',
          rating: 4.8,
          verified: true,
          memberSince: '2023-01-15'
        },
        createdAt: '2024-01-20',
        status: 'available',
        likes: 24,
        views: 156,
        tags: ['iphone', 'smartphone', 'apple', 'pro max'],
        shipping: {
          available: true,
          cost: 500000, // ₦5,000
          estimatedDays: 2
        },
        payment: {
          escrow: true,
          instant: true,
          methods: ['wallet', 'card', 'bank_transfer']
        }
      },
      {
        id: '2',
        name: 'Designer Handbag',
        description: 'Authentic designer handbag in perfect condition. Perfect for special occasions.',
        price: 8500000, // ₦85,000
        images: ['/api/placeholder/300/300'],
        category: 'fashion',
        condition: 'good',
        location: 'Abuja, Nigeria',
        seller: {
          id: '2',
          name: 'Fashion Forward',
          avatar: '',
          rating: 4.6,
          verified: true,
          memberSince: '2023-03-10'
        },
        createdAt: '2024-01-18',
        status: 'available',
        likes: 18,
        views: 89,
        tags: ['handbag', 'designer', 'luxury', 'fashion'],
        shipping: {
          available: true,
          cost: 300000, // ₦3,000
          estimatedDays: 3
        },
        payment: {
          escrow: true,
          instant: true,
          methods: ['wallet', 'card']
        }
      }
    ];

    const mockServices: Service[] = [
      {
        id: '1',
        name: 'Web Design & Development',
        description: 'Professional web design and development services. I create modern, responsive websites for businesses and individuals.',
        price: 15000000, // ₦150,000
        images: ['/api/placeholder/300/300'],
        category: 'design',
        location: 'Lagos, Nigeria',
        provider: {
          id: '3',
          name: 'Creative Web Solutions',
          avatar: '',
          rating: 4.9,
          verified: true,
          memberSince: '2022-11-05'
        },
        createdAt: '2024-01-15',
        status: 'available',
        likes: 32,
        views: 234,
        tags: ['web design', 'development', 'responsive', 'modern'],
        availability: {
          schedule: 'Monday - Friday, 9 AM - 6 PM',
          responseTime: 'Within 2 hours'
        },
        delivery: {
          online: true,
          inPerson: false,
          estimatedDays: 14
        }
      },
      {
        id: '2',
        name: 'Math Tutoring',
        description: 'Experienced math tutor for high school and university students. Specializing in calculus, algebra, and statistics.',
        price: 5000000, // ₦50,000
        images: ['/api/placeholder/300/300'],
        category: 'tutoring',
        location: 'Port Harcourt, Nigeria',
        provider: {
          id: '4',
          name: 'Dr. Math Expert',
          avatar: '',
          rating: 4.7,
          verified: true,
          memberSince: '2023-02-20'
        },
        createdAt: '2024-01-12',
        status: 'available',
        likes: 15,
        views: 67,
        tags: ['math', 'tutoring', 'calculus', 'algebra'],
        availability: {
          schedule: 'Weekends, 10 AM - 4 PM',
          responseTime: 'Within 1 hour'
        },
        delivery: {
          online: true,
          inPerson: true,
          estimatedDays: 1
        }
      }
    ];

    setProducts(mockProducts);
    setServices(mockServices);
    setLoading(false);
  }, []);

  const filteredItems = (activeTab === 'products' ? products : services).filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleLike = (itemId: string) => {
    if (activeTab === 'products') {
      setProducts(prev => prev.map(product => 
        product.id === itemId 
          ? { ...product, likes: product.likes + 1 }
          : product
      ));
    } else {
      setServices(prev => prev.map(service => 
        service.id === itemId 
          ? { ...service, likes: service.likes + 1 }
          : service
      ));
    }
    toast.success('Added to favorites!');
  };

  const handleContact = (item: Product | Service) => {
    toast.success(`Contacting ${'seller' in item ? item.seller.name : item.provider.name}...`);
  };

  const handleBuy = (item: Product | Service) => {
    toast.success(`Initiating purchase of ${item.name}...`);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Social Marketplace</h2>
          <p className="text-gray-600 dark:text-gray-400">Buy, sell, and trade with the AjoPay community</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          List Item
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products and services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All Categories
        </Button>
        {productCategories.map(category => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.value)}
            className="gap-2"
          >
            <span>{category.icon}</span>
            {category.label}
          </Button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No items found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search or filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const isProduct = 'seller' in item;
                const sellerOrProvider = isProduct ? item.seller : item.provider;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="relative">
                        <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-t-lg flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                            onClick={() => handleLike(item.id)}
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {isProduct && item.status === 'sold' && (
                          <div className="absolute inset-0 bg-black/50 rounded-t-lg flex items-center justify-center">
                            <Badge className="bg-red-500">SOLD</Badge>
                          </div>
                        )}
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xl font-bold text-green-600">
                              ₦{(item.price / 100).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{sellerOrProvider.rating}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={sellerOrProvider.avatar} />
                              <AvatarFallback>{sellerOrProvider.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {sellerOrProvider.name}
                            </span>
                            {sellerOrProvider.verified && (
                              <Shield className="h-4 w-4 text-blue-500" />
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span>{item.location}</span>
                            <Clock className="h-3 w-3 ml-2" />
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleContact(item)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Contact
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleBuy(item)}
                              disabled={isProduct && item.status === 'sold'}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              {isProduct ? 'Buy' : 'Hire'}
                            </Button>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{item.likes} likes</span>
                            <span>{item.views} views</span>
                          </div>
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

      {/* Item Details Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {/* Item details would go here */}
              <p>Detailed view of {selectedItem.name}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


