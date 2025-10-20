export interface NigerianBank {
  name: string;
  code: string;
  slug: string;
  ussd: string;
  logo?: string;
}

export const NIGERIAN_BANKS: NigerianBank[] = [
  // Traditional Banks
  {
    name: "Access Bank",
    code: "044",
    slug: "access-bank",
    ussd: "*901#"
  },
  {
    name: "Citibank Nigeria",
    code: "023",
    slug: "citibank-nigeria",
    ussd: ""
  },
  {
    name: "Diamond Bank",
    code: "063",
    slug: "diamond-bank",
    ussd: "*426#"
  },
  {
    name: "Ecobank Nigeria",
    code: "050",
    slug: "ecobank-nigeria",
    ussd: "*326#"
  },
  {
    name: "Fidelity Bank",
    code: "070",
    slug: "fidelity-bank",
    ussd: "*770#"
  },
  {
    name: "First Bank of Nigeria",
    code: "011",
    slug: "first-bank-of-nigeria",
    ussd: "*894#"
  },
  {
    name: "First City Monument Bank",
    code: "214",
    slug: "first-city-monument-bank",
    ussd: "*329#"
  },
  {
    name: "Guaranty Trust Bank",
    code: "058",
    slug: "guaranty-trust-bank",
    ussd: "*737#"
  },
  {
    name: "Heritage Bank",
    code: "030",
    slug: "heritage-bank",
    ussd: "*322#"
  },
  {
    name: "Keystone Bank",
    code: "082",
    slug: "keystone-bank",
    ussd: "*7111#"
  },
  {
    name: "Polaris Bank",
    code: "076",
    slug: "polaris-bank",
    ussd: "*833#"
  },
  {
    name: "Providus Bank",
    code: "101",
    slug: "providus-bank",
    ussd: ""
  },
  {
    name: "Stanbic IBTC Bank",
    code: "221",
    slug: "stanbic-ibtc-bank",
    ussd: "*909#"
  },
  {
    name: "Standard Chartered Bank",
    code: "068",
    slug: "standard-chartered-bank",
    ussd: "*977#"
  },
  {
    name: "Sterling Bank",
    code: "232",
    slug: "sterling-bank",
    ussd: "*822#"
  },
  {
    name: "Union Bank of Nigeria",
    code: "032",
    slug: "union-bank-of-nigeria",
    ussd: "*826#"
  },
  {
    name: "United Bank for Africa",
    code: "033",
    slug: "united-bank-for-africa",
    ussd: "*919#"
  },
  {
    name: "Unity Bank",
    code: "215",
    slug: "unity-bank",
    ussd: "*7799#"
  },
  {
    name: "Wema Bank",
    code: "035",
    slug: "wema-bank",
    ussd: "*945#"
  },
  {
    name: "Zenith Bank",
    code: "057",
    slug: "zenith-bank",
    ussd: "*966#"
  },
  
  // Fintech Banks & Digital Banks
  {
    name: "Kuda Bank",
    code: "50211",
    slug: "kuda-bank",
    ussd: ""
  },
  {
    name: "Opay",
    code: "100022",
    slug: "opay",
    ussd: "*955#"
  },
  {
    name: "PalmPay",
    code: "100033",
    slug: "palm-pay",
    ussd: "*222#"
  },
  {
    name: "VFD Microfinance Bank",
    code: "566",
    slug: "vfd-microfinance-bank",
    ussd: ""
  },
  {
    name: "Carbon",
    code: "565",
    slug: "carbon",
    ussd: "*1303#"
  },
  {
    name: "Fairmoney Microfinance Bank",
    code: "51318",
    slug: "fairmoney-microfinance-bank",
    ussd: "*322#"
  },
  {
    name: "Korapay",
    code: "100002",
    slug: "korapay",
    ussd: ""
  },
  {
    name: "Moniepoint",
    code: "100001",
    slug: "moniepoint",
    ussd: "*5576#"
  },
  {
    name: "Paga",
    code: "100004",
    slug: "paga",
    ussd: "*242#"
  },
  {
    name: "Parkway",
    code: "311",
    slug: "parkway",
    ussd: ""
  },
  {
    name: "Paycom",
    code: "100003",
    slug: "paycom",
    ussd: ""
  },
  {
    name: "Rubies Bank",
    code: "125",
    slug: "rubies-bank",
    ussd: ""
  },
  {
    name: "Sparkle Microfinance Bank",
    code: "51310",
    slug: "sparkle-microfinance-bank",
    ussd: ""
  },
  {
    name: "Taj Bank",
    code: "302",
    slug: "taj-bank",
    ussd: ""
  },
  {
    name: "Tangerine Money",
    code: "51269",
    slug: "tangerine-money",
    ussd: ""
  },
  {
    name: "Titan Trust Bank",
    code: "102",
    slug: "titan-trust-bank",
    ussd: ""
  },
  {
    name: "VBank",
    code: "100035",
    slug: "vbank",
    ussd: ""
  },
  {
    name: "Visa",
    code: "100005",
    slug: "visa",
    ussd: ""
  },
  {
    name: "Vulte",
    code: "100006",
    slug: "vulte",
    ussd: ""
  },
  {
    name: "Zenith Bank (Mobile)",
    code: "057",
    slug: "zenith-bank-mobile",
    ussd: "*966#"
  },
  {
    name: "Access Bank (Mobile)",
    code: "044",
    slug: "access-bank-mobile",
    ussd: "*901#"
  },
  {
    name: "GTBank (Mobile)",
    code: "058",
    slug: "gtbank-mobile",
    ussd: "*737#"
  },
  {
    name: "First Bank (Mobile)",
    code: "011",
    slug: "first-bank-mobile",
    ussd: "*894#"
  },
  {
    name: "UBA (Mobile)",
    code: "033",
    slug: "uba-mobile",
    ussd: "*919#"
  },
  {
    name: "FCMB (Mobile)",
    code: "214",
    slug: "fcmb-mobile",
    ussd: "*329#"
  },
  {
    name: "Sterling Bank (Mobile)",
    code: "232",
    slug: "sterling-bank-mobile",
    ussd: "*822#"
  },
  {
    name: "Wema Bank (Mobile)",
    code: "035",
    slug: "wema-bank-mobile",
    ussd: "*945#"
  },
  {
    name: "Union Bank (Mobile)",
    code: "032",
    slug: "union-bank-mobile",
    ussd: "*826#"
  },
  {
    name: "Heritage Bank (Mobile)",
    code: "030",
    slug: "heritage-bank-mobile",
    ussd: "*322#"
  },
  {
    name: "Keystone Bank (Mobile)",
    code: "082",
    slug: "keystone-bank-mobile",
    ussd: "*7111#"
  },
  {
    name: "Polaris Bank (Mobile)",
    code: "076",
    slug: "polaris-bank-mobile",
    ussd: "*833#"
  },
  {
    name: "Unity Bank (Mobile)",
    code: "215",
    slug: "unity-bank-mobile",
    ussd: "*7799#"
  },
  {
    name: "Stanbic IBTC (Mobile)",
    code: "221",
    slug: "stanbic-ibtc-mobile",
    ussd: "*909#"
  },
  {
    name: "Standard Chartered (Mobile)",
    code: "068",
    slug: "standard-chartered-mobile",
    ussd: "*977#"
  },
  {
    name: "Providus Bank (Mobile)",
    code: "101",
    slug: "providus-bank-mobile",
    ussd: ""
  },
  {
    name: "Titan Trust (Mobile)",
    code: "102",
    slug: "titan-trust-mobile",
    ussd: ""
  },
  {
    name: "Taj Bank (Mobile)",
    code: "302",
    slug: "taj-bank-mobile",
    ussd: ""
  },
  {
    name: "Parkway (Mobile)",
    code: "311",
    slug: "parkway-mobile",
    ussd: ""
  },
  {
    name: "Rubies Bank (Mobile)",
    code: "125",
    slug: "rubies-bank-mobile",
    ussd: ""
  }
];

export const getBankByCode = (code: string): NigerianBank | undefined => {
  return NIGERIAN_BANKS.find(bank => bank.code === code);
};

export const getBankByName = (name: string): NigerianBank | undefined => {
  return NIGERIAN_BANKS.find(bank => 
    bank.name.toLowerCase().includes(name.toLowerCase()) ||
    bank.slug.toLowerCase().includes(name.toLowerCase())
  );
};

export const searchBanks = (query: string): NigerianBank[] => {
  const lowercaseQuery = query.toLowerCase();
  return NIGERIAN_BANKS.filter(bank => 
    bank.name.toLowerCase().includes(lowercaseQuery) ||
    bank.slug.toLowerCase().includes(lowercaseQuery) ||
    bank.code.includes(query)
  );
};
