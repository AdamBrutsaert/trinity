# Mobile App Documentation (Expo / React Native)

## Overview

The Trinity mobile application is a cross‑platform client built with **Expo** and **React Native**. It uses **expo-router** for file-based navigation, **TanStack Query** for data fetching/caching, and **Zustand** + **AsyncStorage** for persisted authentication.

Primary user journeys:
- Authenticate (register / login)
- Scan a product barcode and add items to cart
- Review cart, start a PayPal checkout flow, capture payment
- View purchase history (invoices) and order details
- Manage account profile information

## Technology Stack

- **Runtime / UI**: React 19 + React Native 0.81 + Expo SDK 54
- **Navigation**: expo-router (file-based routing)
- **Server client**: Eden Treaty (type-safe client for Elysia) via `@elysiajs/eden`
- **Data fetching**: `@tanstack/react-query`
- **State (auth)**: Zustand
- **Persistence (auth)**: `@react-native-async-storage/async-storage`
- **Camera / scanning**: `expo-camera`
- **Haptics**: `expo-haptics`
- **In-app browser**: `expo-web-browser`
- **Icons**: `@expo/vector-icons`, `expo-symbols` (iOS), Material Icons fallback
- **Testing**: Jest + jest-expo + @testing-library/react-native
- **Lint/format**: Expo lint + Biome (repo-level)


## Project Structure

The router root is configured to `./screens` in `apps/mobile/app.json`.

```text
apps/mobile/
  screens/                 # expo-router routes (file-based)
  components/              # reusable building blocks
    ui/                    # small UI primitives (Collapsible, IconSymbol)
  features/                # domain hooks + auth gate/store
    auth/
    cart/
    deals/
    invoices/
    orders/
    products/
  lib/                     # cross-cutting utilities + API client
  hooks/                   # app-level hooks (theme)
  styles/                  # StyleSheet files per screen/component
  constants/               # theme tokens
  assets/                  # images, avatars, SVGs
  types/                   # global typings (SVG modules, process.env)
```

## Running the Mobile App

From the monorepo root:

- Install dependencies: `bun install`
- Start Expo dev server: `bun --filter @trinity/mobile start`
- Run Jest tests: `bun --filter @trinity/mobile test`

## Environment Variables

The mobile app uses Expo public env vars.

- `EXPO_PUBLIC_API_BASE_URL`
  - Optional.
  - If set, forces the API base URL.
  - If not set, the app tries to infer the host in dev (Expo host URI), then falls back to:
    - Android emulator: `http://10.0.2.2:3000`
    - iOS simulator / others: `http://localhost:3000`

See the computed logic in `apps/mobile/lib/api.ts`.

## Navigation (expo-router)

### Router Root and Providers

The root layout is `apps/mobile/screens/_layout.tsx` and configures:

- `QueryClientProvider` (React Query)
- `SafeAreaProvider`
- `ThemeProvider` from React Navigation (`DarkTheme`/`DefaultTheme`)
- `AuthGate` (redirects between auth routes and protected routes)
- A `Stack` with a modal route registered (`/modal`)

### Routes

File-based routes in `apps/mobile/screens`:

| Route | File | Purpose |
|------:|------|---------|
| `/` | `index.tsx` | Home dashboard (dock + recommendations + notifications) |
| `/login` | `login.tsx` | Sign-in form |
| `/register` | `register.tsx` | Sign-up form |
| `/scan` | `scan.tsx` | Barcode scanner + product details + add-to-cart |
| `/cart` | `cart.tsx` | Cart overview + quantity + purchase bar |
| `/purchase` | `purchase.tsx` | PayPal browser checkout + capture |
| `/history` | `history.tsx` | Invoice list |
| `/history-order?id=...` | `history-order.tsx` | Invoice detail + line items |
| `/deals?open=promos\|forYou` | `deals.tsx` | Promos + recommendations |
| `/account-management` | `account-management.tsx` | Profile edit + avatar picker |
| `/modal` | `modal.tsx` | Example modal screen |

## Auth (Zustand + AsyncStorage)

### Auth model

Auth is stored in a Zustand store and persisted to AsyncStorage.

- Keys:
  - `@trinity_token`
  - `@trinity_profile`

- Initialization:
  - `initializeAuth()` is called once in the root layout.
  - If both token and profile are present, the store is hydrated.

### AuthGate behavior

`AuthGate` inspects the current route segments and redirects:

- If the user is not logged in and the route is not `/login` or `/register` → redirects to `/login`.
- If the user is logged in and is on an auth route → redirects to `/`.

### Mutations

Located in `apps/mobile/features/auth/store.ts`:

- `useLogin()` → `client.auth.login.post({ email, password })`
- `useRegister()` → `client.auth.register.post({ ... })`
- `useLogout()` → clears AsyncStorage + store
- `useUpdateProfile()` → `client.users.me.put(...)` (Bearer token)

## Data Fetching & Caching (TanStack Query)

React Query is used in feature hooks under `apps/mobile/features/*/hooks.ts`.

General patterns:
- Use a stable `queryKey` per resource (e.g. `["cart"]`, `["deals"]`)
- Pass `Authorization: Bearer <token>` for authenticated routes
- Use `queryClient.invalidateQueries()` after mutations
- Use optimistic updates in cart mutations (`useCartUpdateItem`, `useCartRemoveItem`)

## API Client (Eden Treaty)

The app uses a type-safe client defined in `apps/mobile/lib/api.ts`:

- `client = treaty<typeof App>(apiBaseUrl)`
- `apiBaseUrl` is computed depending on env/dev host

This is preferred over manual `fetch()` calls, except for compatibility fallbacks.

## Styling & Theming

### Theme tokens

- Colors are defined in `apps/mobile/constants/theme.ts`.
- The app uses system color scheme (`useColorScheme()`) and maps it into:
  - React Navigation theme provider
  - custom hook `useThemeColor()`

### Themed primitives

- `ThemedText` and `ThemedView` implement light/dark overrides via `useThemeColor()`.

### Style organization

- Screen styles: `apps/mobile/styles/screens/*.styles.ts`
- Component styles: `apps/mobile/styles/components/*.styles.ts`

## Testing

Jest is configured in `apps/mobile/jest.config.js` (Expo preset + Bun workspace node_modules paths).

Common commands:
- `bun --filter @trinity/mobile test`
- `bun --filter @trinity/mobile test:coverage`

Tests exist for several foundational components (buttons, theming, small utilities) and for some `lib/*` helpers.

---

# Screens Reference

This section documents each route component under `apps/mobile/screens`.

## Home (`/`)

File: `apps/mobile/screens/index.tsx`

Responsibilities:
- Welcomes the user using name heuristics from the auth store.
- Shows notifications (static list for now).
- Loads recommendations via `useRecommendations()`.
- Provides a bottom dock with quick actions (scan/cart/history/account).

Key dependencies:
- `BottomDock`, `HomeHeader`, `HomeNotificationsSection`, `HomeDealsRecommendationsSection`
- `useLogout`, `useRecommendations`, `useAddProductToCart`

## Login (`/login`)

File: `apps/mobile/screens/login.tsx`

Responsibilities:
- Collect email/password.
- Calls `useLogin().mutateAsync()`.
- Displays errors using a permissive `formatApiError()`.

## Register (`/register`)

File: `apps/mobile/screens/register.tsx`

Responsibilities:
- Collects form data + client-side validation.
- Calls `useRegister().mutateAsync()`.

## Scan (`/scan`)

File: `apps/mobile/screens/scan.tsx`

Responsibilities:
- Shows `ProductScanner` and receives barcode scan results.
- Fetches the product from API via `useProductByBarcode(barcode)`.
- Allows choosing a quantity via `QuantityStepper`.
- Adds to cart via `useAddProductToCart()` and shows an `AppleToast`.

Notes:
- Implements state transitions: scanning → loading → product details / not found / error.
- Throttling is implemented in `ProductScanner` (see component docs).

## Cart (`/cart`)

File: `apps/mobile/screens/cart.tsx`

Responsibilities:
- Loads cart items (`useCartItems()`).
- Maps API response into simplified UI model (`CartItem`).
- Updates quantities with optimistic updates via `useCartUpdateItem()`.
- Removes items via `useCartRemoveItem()`.
- Navigates to purchase flow via `/purchase`.

## Purchase (`/purchase`)

File: `apps/mobile/screens/purchase.tsx`

Responsibilities:
- Collect shipping info (pre-filled from auth profile).
- Create PayPal order (`useCreateOrder()`) and open approval URL.
- Use `expo-web-browser` auth session to handle redirect back into app.
- Capture PayPal order (`useCaptureOrder(orderId)`), then navigate home.

Deep link notes:
- Uses `mobile://payment/success` and `mobile://payment/cancel` as return/cancel URLs.

## History (`/history`)

File: `apps/mobile/screens/history.tsx`

Responsibilities:
- Loads the user’s invoices via `useMyInvoices()`.
- Renders invoices as `PurchaseHistoryRow`.
- Offers an actions bar (`HistoryActionsBar`) for quick scan/cart navigation.

## History Order (`/history-order?id=...`)

File: `apps/mobile/screens/history-order.tsx`

Responsibilities:
- Loads invoice details via `useInvoice(id)`.
- Displays status badge, shipping address, and line items.
- Provides a close button via `HistoryOrderActionsBar`.

## Deals (`/deals`)

File: `apps/mobile/screens/deals.tsx`

Responsibilities:
- Shows promos (`useDeals()`) and recommendations (`useRecommendations()`).
- Supports collapsing sections via `DealsSectionCard`.
- Adds recommended items to cart.
- Uses an `AppleToast` for feedback.

Compatibility note:
- The deals hooks include a 404 fallback to trailing-slash routes.

## Account Management (`/account-management`)

File: `apps/mobile/screens/account-management.tsx`

Responsibilities:
- Displays and edits user profile fields.
- Detects dirty state vs baseline.
- Saves via `useUpdateProfile()`.
- Lets the user pick an avatar via `ProfileAvatarPicker`.
- Shows a fixed save bar (`ProfileSaveBar`).

## Modal (`/modal`)

File: `apps/mobile/screens/modal.tsx`

Responsibilities:
- Demonstration route using themed primitives and a dismissing link.

---

# Feature Hooks Reference

## Auth (`apps/mobile/features/auth`)

- `useAuthStore`: Zustand store for `{ user, token, loading }`.
- `initializeAuth()`: hydrates store from AsyncStorage.
- `useLogin()`, `useRegister()`: mutations that also persist state.
- `useLogout()`: clears persisted auth state.
- `useUpdateProfile()`: updates `/users/me` and updates the stored profile.

## Cart (`apps/mobile/features/cart/hooks.ts`)

- `useCartItems()` (query key: `["cart"]`)
- `useCartAddItem()`
- `useCartUpdateItem()` with optimistic UI and rollback on error
- `useCartRemoveItem()` with optimistic UI and rollback on error
- `useCartClear()`

## Products (`apps/mobile/features/products/hooks.ts`)

- `useProductByBarcode(barcode)` (query key: `["product", "barcode", barcode]`)
  - `enabled: !!barcode`
  - `retry: false` (treat not found as a normal outcome)
- `useAddProductToCart()`
  - Optimistically adjusts cart quantities when the item already exists.

## Deals (`apps/mobile/features/deals/hooks.ts`)

- `useDeals()` (public endpoint)
- `useRecommendations()` (auth endpoint)

Notes:
- Both include a fetch fallback when the API returns 404 due to trailing-slash route matching.

## Orders (`apps/mobile/features/orders/hooks.ts`)

- `useCreateOrder()` returns `{ orderId, approvalUrl }`.
- `useCaptureOrder(orderId)` invalidates the cart query on success.
- `extractErrorMessage(error, fallback)` is exported for screens.

## Invoices (`apps/mobile/features/invoices/hooks.ts`)

- `useMyInvoices()` loads invoices for the authenticated user.
- `useInvoice(id)` loads a specific invoice with items.

---

# Component Reference

This section documents the reusable building blocks under `apps/mobile/components`.

## Catalog

| Component | File | Tested | Summary |
|----------|------|:------:|---------|
| ActionButton | `components/action-button.tsx` | ✅ | Square action tile used in docks and action bars |
| AppleToast | `components/apple-toast.tsx` |  | Animated top toast for transient feedback |
| BottomDock | `components/bottom-dock.tsx` |  | Home bottom action dock (collapsible) |
| CartItemRow | `components/cart-item-row.tsx` |  | Cart list row with stepper + remove |
| CartOverviewCard | `components/cart-overview-card.tsx` |  | Cart header summary + scan tip |
| CartPurchaseBar | `components/cart-purchase-bar.tsx` | ✅ | Fixed purchase bar at bottom |
| CartSummaryCard | `components/cart-summary-card.tsx` | ✅ | Summary card with purchase button (legacy/alternate UI) |
| DealProductRow | `components/deal-product-row.tsx` |  | Deal/recommendation row with pricing + add button |
| DealsSectionCard | `components/deals-section-card.tsx` |  | Expandable section container |
| ExternalLink | `components/external-link.tsx` | ✅ | In-app browser link wrapper |
| HapticTab | `components/haptic-tab.tsx` |  | Tab bar pressable with iOS haptics |
| HelloWave | `components/hello-wave.tsx` | ✅ | Small animated wave glyph |
| HomeDealsRecommendationsSection | `components/home-deals-recommendations-section.tsx` |  | Home promo cards + recommendation list |
| HomeHeader | `components/home-header.tsx` |  | Home header with logout pill |
| HomeNotificationsSection | `components/home-notifications-section.tsx` |  | Home notifications list |
| ParallaxScrollView | `components/parallax-scroll-view.tsx` |  | Parallax header scroll wrapper |
| PrimaryButton | `components/primary-button.tsx` | ✅ | Primary CTA button |
| ProductScanner | `components/product-scanner.tsx` |  | Camera + barcode scanning wrapper |
| ProfileAvatarPicker | `components/profile-avatar-picker.tsx` |  | Avatar grid picker + helper to map id→image |
| ProfileSaveBar | `components/profile-save-bar.tsx` |  | Bottom bar showing dirty state and save CTA |
| ProfileTextField | `components/profile-text-field.tsx` | ✅ | Labeled text input used in account screen |
| PurchaseHistoryRow | `components/purchase-history-row.tsx` |  | Invoice list item row |
| PurchaseLineItemRow | `components/purchase-line-item-row.tsx` |  | Invoice line item row |
| QuantityStepper | `components/quantity-stepper.tsx` | ✅ | +/- stepper used in cart and scan |
| ThemedText | `components/themed-text.tsx` | ✅ | Theme-aware Text primitive |
| ThemedView | `components/themed-view.tsx` | ✅ | Theme-aware View primitive |
| Collapsible | `components/ui/collapsible.tsx` |  | Simple expand/collapse container |
| IconSymbol | `components/ui/icon-symbol.tsx` |  | Cross-platform icon abstraction (iOS SF Symbols / Material fallback) |

> “Tested” refers to the presence of a sibling `*.test.tsx` file.

---

## ActionButton

File: `apps/mobile/components/action-button.tsx`

Purpose:
- A compact tile-like CTA used in docks and quick action rows.

Props:
- `title: string`
- `subtitle: string`
- `onPress: () => void`
- `Icon?: React.ComponentType<SvgProps>`
- `iconColor?: string` (default `#fff`)

Behavior notes:
- Sets `accessibilityRole="button"`.
- Uses `hitSlop` for easier tapping.

Example:

```tsx
<ActionButton
  title="Scan"
  subtitle="Product"
  onPress={() => router.push("/scan")}
  Icon={ScanBarcodeIcon}
/>
```

Tests:
- `apps/mobile/components/action-button.test.tsx`

## PrimaryButton

File: `apps/mobile/components/primary-button.tsx`

Purpose:
- Standard primary CTA (full-width within its container).

Props:
- `title: string`
- `onPress: () => void`
- `disabled?: boolean`

Tests:
- `apps/mobile/components/primary-button.test.tsx`

## QuantityStepper

File: `apps/mobile/components/quantity-stepper.tsx`

Purpose:
- +/- control for integer quantities.

Props:
- `value: number`
- `minValue?: number` (default `1`)
- `onChange: (next: number) => void`

Behavior notes:
- Decrement button is disabled when `value <= minValue`.

Tests:
- `apps/mobile/components/quantity-stepper.test.tsx`

## AppleToast

File: `apps/mobile/components/apple-toast.tsx`

Purpose:
- Non-interactive toast message anchored to the top safe area.

Props:
- `visible: boolean`
- `title?: string` (default `"SCAN"`)
- `message: string`
- `topInset: number` (pass `useSafeAreaInsets().top`)
- `onDismiss: () => void`
- `durationMs?: number` (default `2200`)

Behavior notes:
- Uses `Animated.Value` for translate/opacity.
- `pointerEvents="none"` so it never blocks touches.

## BottomDock

File: `apps/mobile/components/bottom-dock.tsx`

Purpose:
- A floating bottom action area on the Home screen.

Types:
- `BottomDockAction`:
  - `key`, `title`, `subtitle`, `onPress`, optional `Icon`, `iconColor`

Props:
- `collapsed: boolean`
- `onToggleCollapsed: () => void`
- `onLayout: (e: LayoutChangeEvent) => void` (used by the screen to measure height)
- `bottomOffset: number` (usually derived from safe area)
- `paddingBottom: number` (visual spacing)
- `actions: BottomDockAction[]`

Behavior notes:
- Collapsing hides the action grid.

## HomeHeader

File: `apps/mobile/components/home-header.tsx`

Purpose:
- Displays the brand and greeting, plus logout.

Props:
- `firstName: string | null`
- `onLogout: () => void`

## HomeNotificationsSection

File: `apps/mobile/components/home-notifications-section.tsx`

Purpose:
- Renders a vertical list of notification cards.

Props:
- `title: string`
- `notifications: { id: string; title: string; body: string }[]`
- `onPressNotification: (notification) => void`

## HomeDealsRecommendationsSection

File: `apps/mobile/components/home-deals-recommendations-section.tsx`

Purpose:
- Promo shortcuts + a short list of personalized recommendations.

Props:
- `title: string`
- `recommendations: { id: string; title: string; reason: string }[]`
- `onPressDeals: () => void`
- `onPressQuickPicks: () => void`
- `onPressRecommendation: (recommendation) => void`

## DealsSectionCard

File: `apps/mobile/components/deals-section-card.tsx`

Purpose:
- Expand/collapse container used in Deals screen.

Props:
- `variant: "promo" | "forYou"`
- `pillLabel: string`
- `title: string`
- `subtitle: string`
- `open: boolean`
- `onPress: () => void`
- `children` (rendered only when open)

## DealProductRow

File: `apps/mobile/components/deal-product-row.tsx`

Purpose:
- Row layout for a deal item with formatted price and optional discount.

Model:
- `DealProductRowModel`:
  - `id`, `name`, `subtitle`, `unitPriceCents`, optional `originalUnitPriceCents`

Props:
- `item: DealProductRowModel`
- `actionLabel?: string` (default `"Add"`)
- `onPressAction: (item) => void`

Behavior notes:
- Computes and clamps discount percent between 0 and 90.

## CartOverviewCard

File: `apps/mobile/components/cart-overview-card.tsx`

Purpose:
- Header card for the cart screen.

Props:
- `totalCents: number`
- `itemsCount: number`
- `onScanMore: () => void`

## CartItemRow

File: `apps/mobile/components/cart-item-row.tsx`

Purpose:
- Render a cart line with a quantity stepper and a remove button.

Types:
- `CartItem`: `{ id, name, unitPriceCents, quantity }`

Props:
- `item: CartItem`
- `onChangeQuantity: (id: string, quantity: number) => void`
- `onRemove: (id: string) => void`

## CartPurchaseBar

File: `apps/mobile/components/cart-purchase-bar.tsx`

Purpose:
- Fixed bottom purchase CTA used in `/cart`.

Props:
- `totalCents: number`
- `itemsCount: number`
- `bottomInset: number`
- `onPurchase: () => void`
- `onLayout: (e: LayoutChangeEvent) => void`

Tests:
- `apps/mobile/components/cart-purchase-bar.test.tsx`

## CartSummaryCard

File: `apps/mobile/components/cart-summary-card.tsx`

Purpose:
- Alternate cart summary component (not used by the current cart screen).

Props:
- `totalCents: number`
- `itemsCount: number`
- `onPurchase: () => void`

Tests:
- `apps/mobile/components/cart-summary-card.test.tsx`

## HistoryActionsBar

File: `apps/mobile/components/history-actions-bar.tsx`

Purpose:
- Fixed bottom actions for `/history`.

Props:
- `onScan: () => void`
- `onCart: () => void`
- `onLayout: (e: LayoutChangeEvent) => void`

## HistoryOrderActionsBar

File: `apps/mobile/components/history-order-actions-bar.tsx`

Purpose:
- Fixed close bar for `/history-order`.

Props:
- `onClose: () => void`
- `onLayout: (e: LayoutChangeEvent) => void`

## PurchaseHistoryRow

File: `apps/mobile/components/purchase-history-row.tsx`

Purpose:
- Invoice preview row.

Props:
- `item: Invoice` (re-exported as `PurchaseHistoryItem`)
- `onPress: (item) => void`

Behavior notes:
- Formats date with `en-GB` locale.
- Formats money using `USD` currency (this is current behavior in code).

## PurchaseLineItemRow

File: `apps/mobile/components/purchase-line-item-row.tsx`

Purpose:
- Invoice line item (qty × unit price, plus line total).

Props:
- `item: InvoiceItem`

## ProfileTextField

File: `apps/mobile/components/profile-text-field.tsx`

Purpose:
- Labeled text input with a disabled mode.

Props:
- `label: string`
- `value: string`
- `onChangeText: (value: string) => void`
- `placeholder?: string`
- `disabled?: boolean`
- Plus most `TextInputProps` except `value`, `onChangeText`, `placeholder`, `editable`.

Tests:
- `apps/mobile/components/profile-text-field.test.tsx`

## ProfileSaveBar

File: `apps/mobile/components/profile-save-bar.tsx`

Purpose:
- Fixed bottom bar that reflects dirty state and triggers save.

Props:
- `enabled: boolean`
- `saving: boolean`
- `bottomInset: number`
- `onSave: () => void`
- `onLayout: (e: LayoutChangeEvent) => void`

## ProfileAvatarPicker

File: `apps/mobile/components/profile-avatar-picker.tsx`

Purpose:
- Lets the user pick an avatar from bundled PNG assets.

Exports:
- `getProfileAvatarSource(avatarId)` → resolves an image source or `null`.

Props:
- `selectedId: number | null`
- `onSelect: (avatarId: number) => void`
- `title?: string` (default `"Choose a profile photo"`)

Behavior notes:
- Collapsed mode shows a stable first row of 8 avatars.
- If the selected avatar is not in the first row, it swaps it into the row so the selection stays visible.
- Expanded mode shows the remaining avatars in a grid.

## ProductScanner

File: `apps/mobile/components/product-scanner.tsx`

Purpose:
- Wraps Expo Camera and emits barcode scans.

Props:
- `onScanned: (result: { data: string; type: string }) => void`
- `scanningEnabled?: boolean` (default `true`)

Behavior notes:
- Requests camera permission if needed.
- Throttles scans to one every ~1200ms.
- When `scanningEnabled` is false, `onBarcodeScanned` is disabled.

## ExternalLink

File: `apps/mobile/components/external-link.tsx`

Purpose:
- Uses `expo-router` Link, but opens an in-app browser on native.

Props:
- Same as `Link`, except `href` is required.

Tests:
- `apps/mobile/components/external-link.test.tsx`

## HapticTab

File: `apps/mobile/components/haptic-tab.tsx`

Purpose:
- Bottom tab button wrapper that triggers a light haptic on iOS.

Props:
- Standard `BottomTabBarButtonProps`.

## ThemedView

File: `apps/mobile/components/themed-view.tsx`

Purpose:
- Theme-aware wrapper over `View`.

Props:
- `ViewProps` + `{ lightColor?: string; darkColor?: string }`

Tests:
- `apps/mobile/components/themed-view.test.tsx`

## ThemedText

File: `apps/mobile/components/themed-text.tsx`

Purpose:
- Theme-aware wrapper over `Text` with a built-in typography scale.

Props:
- `TextProps` + `{ lightColor?: string; darkColor?: string; type?: ... }`
- `type` values:
  - `default`, `title`, `defaultSemiBold`, `subtitle`, `link`

Tests:
- `apps/mobile/components/themed-text.test.tsx`

## ParallaxScrollView

File: `apps/mobile/components/parallax-scroll-view.tsx`

Purpose:
- Provides a parallax header effect using Reanimated.

Props:
- `headerImage: ReactElement`
- `headerBackgroundColor: { dark: string; light: string }`
- `children`

Notes:
- Uses `useScrollOffset()` and `interpolate()`.

## HelloWave

File: `apps/mobile/components/hello-wave.tsx`

Purpose:
- Small animated waving glyph.

Tests:
- `apps/mobile/components/hello-wave.test.tsx`

---

# UI Subfolder (components/ui)

## Collapsible

File: `apps/mobile/components/ui/collapsible.tsx`

Purpose:
- Toggleable section that shows/hides children.

Props:
- `title: string`
- `children`

Dependencies:
- `IconSymbol`, `ThemedText`, `ThemedView`, theme tokens.

## IconSymbol

Files:
- `apps/mobile/components/ui/icon-symbol.ios.tsx` (uses `expo-symbols`)
- `apps/mobile/components/ui/icon-symbol.tsx` (fallback: `MaterialIcons`)

Purpose:
- Unified icon API across platforms.

Notes:
- On non-iOS, SF Symbol names are mapped manually to Material icon names.

---

# Conventions & Best Practices (Project-Specific)

## Accessibility

Patterns used across components:
- Set `accessibilityRole="button"` on pressables.
- Increase tap target via `hitSlop` where appropriate.
- Use `pointerEvents="none"` for overlays that should not block touches (`AppleToast`).

## Safe Area

- Use `SafeAreaView` for screens.
- For fixed bars/docks, compute bottom offset via `useSafeAreaInsets()` and apply `Math.max(12, bottomInset + 10)`.

## Money and locale formatting

- Cart uses `EUR` formatting for cents via `Intl.NumberFormat("fr-FR", { currency: "EUR" })`.
- History currently formats money as `USD` in invoice rows.

If currency consistency becomes important, centralize formatting in a `lib/money.ts` helper and reuse it.

## React Query keys

Keep keys stable and scoped:
- `cart`: `["cart"]`
- product by barcode: `["product", "barcode", barcode]`
- invoices: `["invoices", "mine", userId]` and `["invoices", id]`

## Error handling style

- Screens generally show user-friendly toasts/alerts.
- Feature hooks throw errors for unexpected statuses.

---

# Appendix: Files Worth Knowing

- `apps/mobile/screens/_layout.tsx` — providers + AuthGate + QueryClient
- `apps/mobile/lib/api.ts` — API base URL computation + treaty client
- `apps/mobile/features/auth/store.ts` — auth persistence + mutations
- `apps/mobile/hooks/use-theme-color.ts` — theme token selector
- `apps/mobile/constants/theme.ts` — color tokens
