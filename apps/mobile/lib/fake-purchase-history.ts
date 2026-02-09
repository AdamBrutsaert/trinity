import type { PurchaseHistoryItem } from '@/components/purchase-history-row';

export type PurchaseLineItem = {
  id: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
};

export type PurchaseHistoryDetails = PurchaseHistoryItem & {
  paymentMethodLabel: string;
  receiptNumber: string;
  lineItems: PurchaseLineItem[];
};

export function getFakePurchases(): PurchaseHistoryItem[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      id: 'ord_1024',
      createdAtIso: new Date(now - day * 1).toISOString(),
      totalCents: 1835,
      itemsCount: 6,
      storeName: 'Trinity Market',
      status: 'paid',
      previewItems: ['Coffee beans', 'Almond milk', 'Whole wheat pasta'],
    },
    {
      id: 'ord_1023',
      createdAtIso: new Date(now - day * 4).toISOString(),
      totalCents: 4299,
      itemsCount: 14,
      storeName: 'Trinity Market',
      status: 'paid',
      previewItems: ['Chicken breast', 'Greek yogurt', 'Tomatoes'],
    },
    {
      id: 'ord_1022',
      createdAtIso: new Date(now - day * 9).toISOString(),
      totalCents: 975,
      itemsCount: 3,
      storeName: 'Trinity Market',
      status: 'refunded',
      previewItems: ['Sparkling water', 'Bananas', 'Chocolate'],
    },
    {
      id: 'ord_1021',
      createdAtIso: new Date(now - day * 15).toISOString(),
      totalCents: 2590,
      itemsCount: 8,
      storeName: 'Trinity Market',
      status: 'pending',
      previewItems: ['Rice', 'Olive oil', 'Eggs'],
    },
  ];
}

export function getFakePurchaseDetailsById(id: string): PurchaseHistoryDetails | null {
  const base = getFakePurchases().find((x) => x.id === id);
  if (!base) return null;

  const detailsById: Record<string, Omit<PurchaseHistoryDetails, keyof PurchaseHistoryItem>> = {
    ord_1024: {
      paymentMethodLabel: 'Visa •••• 4242',
      receiptNumber: 'RCP-1024-TRI',
      lineItems: [
        { id: 'coffee', name: 'Coffee beans', quantity: 1, unitPriceCents: 699 },
        { id: 'pasta', name: 'Whole wheat pasta', quantity: 2, unitPriceCents: 239 },
        { id: 'milk', name: 'Almond milk', quantity: 1, unitPriceCents: 319 },
        { id: 'bananas', name: 'Bananas', quantity: 2, unitPriceCents: 170 },
      ],
    },
    ord_1023: {
      paymentMethodLabel: 'Apple Pay',
      receiptNumber: 'RCP-1023-TRI',
      lineItems: [
        { id: 'chicken', name: 'Chicken breast', quantity: 2, unitPriceCents: 799 },
        { id: 'yogurt', name: 'Greek yogurt', quantity: 4, unitPriceCents: 159 },
        { id: 'tomato', name: 'Tomatoes', quantity: 6, unitPriceCents: 149 },
        { id: 'oil', name: 'Olive oil', quantity: 1, unitPriceCents: 1099 },
      ],
    },
    ord_1022: {
      paymentMethodLabel: 'Mastercard •••• 1389',
      receiptNumber: 'RCP-1022-TRI',
      lineItems: [
        { id: 'water', name: 'Sparkling water', quantity: 1, unitPriceCents: 275 },
        { id: 'choc', name: 'Chocolate', quantity: 1, unitPriceCents: 349 },
        { id: 'banana', name: 'Bananas', quantity: 2, unitPriceCents: 175 },
      ],
    },
    ord_1021: {
      paymentMethodLabel: 'Cash',
      receiptNumber: 'RCP-1021-TRI',
      lineItems: [
        { id: 'rice', name: 'Rice', quantity: 2, unitPriceCents: 299 },
        { id: 'eggs', name: 'Eggs', quantity: 2, unitPriceCents: 249 },
        { id: 'bread', name: 'Bread', quantity: 2, unitPriceCents: 159 },
        { id: 'oil', name: 'Olive oil', quantity: 1, unitPriceCents: 799 },
      ],
    },
  };

  const extra = detailsById[id];
  if (!extra) return null;

  const computedTotal = extra.lineItems.reduce(
    (acc, li) => acc + li.quantity * li.unitPriceCents,
    0,
  );

  return {
    ...base,
    ...extra,
    totalCents: base.totalCents || computedTotal,
  };
}
