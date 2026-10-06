export type VentureId = 'lemonade' | 'art' | 'bakes' | 'plants';
export type AvatarAccessory = 'none' | 'cap' | 'glasses' | 'headband' | 'bow';

export interface Venture {
  id: VentureId;
  name: string;
  shortName: string;
  description: string;
  product: string;
  unitCost: number;
  salePrice: number;
  icon: 'water-outline' | 'color-palette-outline' | 'cafe-outline' | 'leaf-outline';
  tone: 'gold' | 'orange' | 'blue' | 'mint';
}

export const VENTURES: Venture[] = [
  {
    id: 'lemonade',
    name: 'Lemonade Stand',
    shortName: 'Lemonade',
    description: 'Mix up a sunny neighborhood favorite.',
    product: 'Fresh lemonade',
    unitCost: 3,
    salePrice: 8,
    icon: 'water-outline',
    tone: 'gold',
  },
  {
    id: 'art',
    name: 'Art & Print Studio',
    shortName: 'Art studio',
    description: 'Turn your creative ideas into mini prints.',
    product: 'Mini art print',
    unitCost: 5,
    salePrice: 12,
    icon: 'color-palette-outline',
    tone: 'orange',
  },
  {
    id: 'bakes',
    name: 'Little Bake Shop',
    shortName: 'Bake shop',
    description: 'Make a treat worth coming back for.',
    product: 'Cookie box',
    unitCost: 4,
    salePrice: 10,
    icon: 'cafe-outline',
    tone: 'blue',
  },
  {
    id: 'plants',
    name: 'Plant Pals',
    shortName: 'Plant shop',
    description: 'Help tiny plants find a happy home.',
    product: 'Starter seedling',
    unitCost: 5,
    salePrice: 14,
    icon: 'leaf-outline',
    tone: 'mint',
  },
];

export interface Quest {
  id: string;
  title: string;
  skill: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface BusinessEvent {
  id: string;
  title: string;
  story: string;
  choices: { label: string; detail: string }[];
}

export const BUSINESS_EVENTS: BusinessEvent[] = [
  {
    id: 'broken-cooler',
    title: 'Uh-oh! The cooler stopped.',
    story: 'The lemonade is getting warm. A few customers are already in line. What is your smartest next move?',
    choices: [
      { label: 'Use my emergency fund', detail: 'Spend 12 Biz Bucks to borrow a cooler and keep serving.' },
      { label: 'Pause and protect the drinks', detail: 'Stop sales, save your stock, and plan a safe restart.' },
      { label: 'Ask my mentor for a hand', detail: 'Spend 5 Biz Bucks and learn how to check the cooler.' },
    ],
  },
  {
    id: 'rainy-market',
    title: 'Rain is coming!',
    story: 'Dark clouds roll over your busy market. Your table is outside and the first drops are falling.',
    choices: [
      { label: 'Rent a covered spot', detail: 'Spend 8 Biz Bucks to stay open and keep your display dry.' },
      { label: 'Move inside with a neighbor', detail: 'Team up, share space, and keep your money safe.' },
      { label: 'Close early and make a plan', detail: 'Protect your supplies and decide what to improve next time.' },
    ],
  },
  {
    id: 'supply-shortage',
    title: 'Your supplier is out!',
    story: 'You need more supplies, but your usual shop has sold out. Customers are expecting you.',
    choices: [
      { label: 'Buy a backup batch', detail: 'Spend 16 Biz Bucks to restock from a different shop.' },
      { label: 'Ask another maker to share', detail: 'Offer a fair trade and keep some money in your wallet.' },
      { label: 'Save your emergency fund', detail: 'Take a short break and compare prices before buying.' },
    ],
  },
];

export const QUESTS: Quest[] = [
  {
    id: 'budget-basics',
    title: 'The Pop-up Budget',
    skill: 'PLAN YOUR MONEY',
    prompt:
      'You have 40 Biz Bucks. A table costs 12 and supplies cost 18. How much can you still save?',
    options: ['10 Biz Bucks', '20 Biz Bucks', '30 Biz Bucks'],
    answerIndex: 0,
    explanation:
      '12 + 18 = 30. Set aside the 10 left over before spending it. A plan helps your business handle surprises.',
  },
  {
    id: 'smart-saver',
    title: 'Save for the Next Batch',
    skill: 'SAVE & REINVEST',
    prompt:
      'Your art prints earned 36 Biz Bucks. The next batch will cost 15. What is a smart first move?',
    options: [
      'Save 15 for supplies, then plan the rest',
      'Spend all 36 on decorations',
      'Give every print away for free',
    ],
    answerIndex: 0,
    explanation:
      'Saving the next batch cost protects your business. Then you can choose how to use the money that remains.',
  },
  {
    id: 'price-puzzle',
    title: 'The Price Puzzle',
    skill: 'REVENUE & COSTS',
    prompt:
      'You make 4 products that cost 3 Biz Bucks each. You sell all 4 for 8 each. What is your profit?',
    options: ['8 Biz Bucks', '20 Biz Bucks', '32 Biz Bucks'],
    answerIndex: 1,
    explanation:
      'Sales bring in 32. Making the products cost 12. Profit is 32 − 12 = 20 Biz Bucks.',
  },
  {
    id: 'needs-wants', title: 'Need It or Want It?', skill: 'SPENDING CHOICES',
    prompt: 'Your shop has 20 Biz Bucks. Supplies cost 12 and a shiny sign costs 15. What should you buy first?',
    options: ['The shiny sign', 'The supplies your products need', 'Neither — spend it on sweets'], answerIndex: 1,
    explanation: 'Supplies let you make products and serve customers. A nice sign is a want that can wait until essentials are covered.',
  },
  {
    id: 'correct-change', title: 'Count the Change', skill: 'MONEY MATH',
    prompt: 'A cookie box costs 7 Biz Bucks. Your customer gives you 10. How much change do you give back?',
    options: ['2 Biz Bucks', '7 Biz Bucks', '3 Biz Bucks'], answerIndex: 2,
    explanation: '10 − 7 = 3. Counting change carefully helps customers trust your shop.',
  },
  {
    id: 'rainy-day', title: 'A Rainy-day Rescue', skill: 'EMERGENCY SAVINGS',
    prompt: 'Your table breaks and fixing it costs 10 Biz Bucks. Which money is best to use?',
    options: ['Money saved for unexpected problems', 'All the money for next week’s supplies', 'A customer’s change'], answerIndex: 0,
    explanation: 'An emergency fund is money kept for surprises. It helps you solve problems without using money already promised for other needs.',
  },
  {
    id: 'compare-suppliers', title: 'The Supply Detective', skill: 'COMPARE VALUE',
    prompt: 'One shop sells 4 equal-quality cups for 8 Biz Bucks. Another sells 6 for 9. Which has a lower cost per cup?',
    options: ['4 cups for 8', '6 cups for 9', 'They cost the same per cup'], answerIndex: 1,
    explanation: '8 ÷ 4 = 2 per cup. 9 ÷ 6 = 1.5 per cup. Comparing the cost of one item helps you spot good value.',
  },
  {
    id: 'customer-care', title: 'Listen Like a Founder', skill: 'CUSTOMER CARE',
    prompt: 'A customer says their print arrived bent. What is a fair first response?',
    options: ['Ignore them', 'Blame the customer', 'Listen and offer a fair replacement'], answerIndex: 2,
    explanation: 'Listening and fixing a genuine problem builds trust. Good customer care is part of running a fair business.',
  },
  {
    id: 'sales-ledger', title: 'Follow the Money', skill: 'RECORD KEEPING',
    prompt: 'You earn 25 Biz Bucks and spend 9 on supplies. What should you write in your money trail?',
    options: ['Both the 25 earned and the 9 spent', 'Only the 25 earned', 'Nothing until you run out'], answerIndex: 0,
    explanation: 'Record money coming in and going out. Your records show what you have, what you spent, and what your business really earned.',
  },
  {
    id: 'fair-pricing', title: 'A Price That Works', skill: 'FAIR PRICING',
    prompt: 'A plant costs 5 Biz Bucks to grow. Customers will pay 8. Which price covers costs and leaves a profit?',
    options: ['4 Biz Bucks', '8 Biz Bucks', '5 Biz Bucks'], answerIndex: 1,
    explanation: 'At 8 you cover the 5 cost and keep 3 profit. A useful price works for both your business and your customers.',
  },
  {
    id: 'saving-goal', title: 'Your Next Big Goal', skill: 'GOAL SETTING',
    prompt: 'A new display costs 30 Biz Bucks. You save 5 each market day. How many market days will you need?',
    options: ['3 days', '5 days', '6 days'], answerIndex: 2,
    explanation: '30 ÷ 5 = 6 market days. Breaking a big goal into smaller savings steps makes it easier to reach.',
  },
  {
    id: 'teamwork-plan', title: 'Make a Great Team', skill: 'TEAMWORK',
    prompt: 'Your friend joins your shop. What should you agree on before starting?',
    options: ['Who does each job and how rewards are shared', 'Who gets the best chair', 'Nothing — guess as you go'], answerIndex: 0,
    explanation: 'Clear jobs and fair rewards help everyone know what to expect. Good teams talk before getting busy.',
  },
  {
    id: 'stock-planning', title: 'Just Enough Stock', skill: 'INVENTORY PLANNING',
    prompt: 'You usually sell 4 cookie boxes each day. Why might making 40 fresh boxes at once be risky?',
    options: ['More is always better', 'Unsold cookies could go stale and waste money', 'Customers dislike cookies'], answerIndex: 1,
    explanation: 'Plan stock around likely sales. Fresh products can spoil, so making far more than customers need can waste your supplies and cash.',
  },
  {
    id: 'honest-marketing', title: 'Tell the True Story', skill: 'HONEST MARKETING',
    prompt: 'Which message is a fair way to tell people about your art prints?',
    options: ['These prints will make you rich!', 'Everyone must buy one!', 'Hand-drawn prints made by our team'], answerIndex: 2,
    explanation: 'Describe what your product really is. Honest messages help customers choose and keep their trust.',
  },
  {
    id: 'reinvest-growth', title: 'Grow One Step at a Time', skill: 'REINVESTMENT',
    prompt: 'You have 20 Biz Bucks of profit after covering your next supplies. What could help your shop grow safely?',
    options: ['Save some and buy a useful tool with the rest', 'Spend everything before planning', 'Promise more products than you can make'], answerIndex: 0,
    explanation: 'Reinvesting means using some profit to improve your business. Keeping savings too helps you handle surprises while growing.',
  },
  {
    id: 'break-even', title: 'Cover Your Costs', skill: 'BREAK-EVEN',
    prompt: 'You pay 12 Biz Bucks for a stall. Each sale leaves 3 after product costs. How many sales cover the stall fee?',
    options: ['3 sales', '4 sales', '12 sales'], answerIndex: 1,
    explanation: '12 ÷ 3 = 4 sales. At that point you have covered the stall fee; later sales can add profit.',
  },
  {
    id: 'safe-help', title: 'Know When to Ask', skill: 'SAFE DECISIONS',
    prompt: 'A shop machine stops working and you do not know how to fix it. What is the safest move?',
    options: ['Keep using it anyway', 'Take it apart alone', 'Pause and ask a trusted grown-up or mentor'], answerIndex: 2,
    explanation: 'Pause unsafe work and ask someone who knows how to help. A good founder protects people as well as products.',
  },
  {
    id: 'discount-math', title: 'The Discount Check', skill: 'DISCOUNTS & PROFIT',
    prompt: 'Your print costs 4 Biz Bucks to make and normally sells for 10. You offer 2 off. What profit is left?',
    options: ['4 Biz Bucks', '6 Biz Bucks', '8 Biz Bucks'], answerIndex: 0,
    explanation: 'The discounted price is 10 − 2 = 8. Then subtract the 4 cost: 8 − 4 = 4 profit. Check costs before offering a discount.',
  },
];

export const SKIN_TONES = [
  { name: 'Warm tan', value: '#D99B6E' },
  { name: 'Golden', value: '#F0BC88' },
  { name: 'Cocoa', value: '#9C6347' },
  { name: 'Deep brown', value: '#704633' },
  { name: 'Peach', value: '#F4D0AD' },
];

export const HAIR_COLORS = [
  { name: 'Espresso', value: '#39251F' },
  { name: 'Chestnut', value: '#754128' },
  { name: 'Midnight', value: '#292D3C' },
  { name: 'Copper', value: '#C16C43' },
];

export const SHIRT_COLORS = [
  { name: 'Sunshine', value: '#F3BF43' },
  { name: 'Coral', value: '#F2734E' },
  { name: 'Ocean', value: '#5A9AD0' },
  { name: 'Garden', value: '#5BA57F' },
  { name: 'Lilac', value: '#8970CB' },
];

export const PLAYER_NAMES = ['Alex', 'Jordan', 'Riley', 'Sam'];

export const BADGES = [
  { id: 'first-idea', name: 'Big Idea', detail: 'Started your first business', icon: 'bulb-outline' },
  { id: 'first-sale', name: 'First Sale', detail: 'Made your first sale', icon: 'pricetag-outline' },
  { id: 'first-quest', name: 'Quick Thinker', detail: 'Solved your first money quest', icon: 'flash-outline' },
  { id: 'smart-saver', name: 'Smart Saver', detail: 'Set money aside for later', icon: 'shield-checkmark-outline' },
  { id: 'decision-maker', name: 'Decision Maker', detail: 'Finished every money quest', icon: 'trophy-outline' },
  { id: 'sales-star', name: 'Sales Star', detail: 'Served five customers in one market week', icon: 'star-outline' },
  { id: 'team-player', name: 'Team Player', detail: 'Hired a helper and grew your shop', icon: 'people-outline' },
] as const;
