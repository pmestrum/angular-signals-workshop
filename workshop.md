# Angular signals workshop

Language: English | [Nederlands](workshop.nl.md)

You get a small webshop that uses **no signals at all**. Step by step you convert it into a fully signal based, zoneless Angular 22 app. Every step introduces one signal API.

Expected time: about 90 minutes. The app is only 800 x 600 pixels, so a small browser window is fine.

## The app

- The header shows how many items are in the cart.
- The nav has category buttons, a `simulate error` checkbox and a `reload` button.
- The product list shows the products of the chosen category (a fake backend: `public/products.json` with a 600 ms delay).
- Select a product to see it in the detail panel, pick a quantity (1 to 9) and add it to the cart.
- The cart lists the lines, with a total, and lets you remove a line.

Components (all in `src/app`, with inline template and styles):

| Component | Role |
| --- | --- |
| `App` | owns the state: category, products, selected product, cart |
| `ProductList` | shows products, tells the parent which one was picked |
| `ProductDetail` | shows the selected product and the quantity, adds it to the cart |
| `QuantityPicker` | the `- 1 +` control |
| `Cart` | shows the cart lines and the total |

`products.api.ts` (the fake backend) never changes. Do not touch `product.model.ts` either.

## Setup

```bash
npm install
git checkout -b workshop step-0
npm start
```

Open http://localhost:4200.

Every step has a git tag. The tag `step-N` contains the **solution of step N**, so `step-0` is where you start and `step-8` is the end result. If you get stuck, compare with the solution:

```bash
git diff step-3 -- src/app          # what is different between my work and the solution
git diff step-2 step-3 -- src/app   # what changed in step 3
```

Or throw your work away and continue from a solution: `git checkout -f step-3`.

## Step 0: look at the baseline

Run the app and play with it. Then find the two bugs this app has on purpose:

1. Select a book, then click `games`. The detail panel still shows the book, even though it is no longer in the list.
2. Select a product, click `+` a few times, then select another product. The quantity is not reset.

Also click the category buttons quickly after each other. The list can show the result of a request that was started earlier (a race condition).

Open `src/app/app.ts`. All state is plain class fields. Look at the components: every component has `changeDetection: ChangeDetectionStrategy.Eager`.

> **Why `Eager`?** Since Angular 22, `OnPush` is the default change detection strategy. A component that is not `OnPush` must now say so explicitly with `Eager`. Our baseline uses plain fields and `zone.js`, so it needs `Eager` to refresh. At the end of the workshop all `Eager` lines are gone.

## Step 1: `signal`

**Goal:** turn the state into signals.

A `signal` is a box with a value. You read it by calling it, you write with `.set()` or `.update()`. The template knows which signals it reads and refreshes only when they change.

**Change** in `app.ts`:

- Make `category`, `products`, `loading`, `error`, `simulateError`, `selected` and `cart` a `signal(...)`. Give the empty ones a type, for example `signal<Product[]>([])` and `signal<Product | undefined>(undefined)`.
- Replace every write `this.x = value` with `this.x.set(value)`, and every read `this.x` with `this.x()`. This includes the template and the `cartCount` getter.
- For `cart`, use `update` when the new value depends on the old one:

```ts
this.cart.update((cart) => cart.filter((l) => l.product.id !== productId));
```

- In `product-detail.ts`, make `quantity` a `signal(1)` as well.

**Check:** the app behaves exactly as before.

**Why:** the app still works because the template reads the signals. The bugs from step 0 are still there. We fix them in step 7.

Solution: `step-1`.

## Step 2: `computed`

**Goal:** derive a value instead of calculating it again and again.

`cartCount` in `app.ts` is a getter that recalculates on every change detection. A `computed` calculates lazily, caches the result and only recalculates when a signal it read has changed.

**Change:**

```ts
cartCount = computed(() => this.cart().reduce((count, line) => count + line.quantity, 0));
```

Use `cartCount()` in the template.

**Check:** the `cart: n` pill in the header still updates.

**Why:** you never "update" a computed. It is read only. You do not list its dependencies: they are discovered when it runs.

Solution: `step-2`.

## Step 3: `input`, `input.required` and `output`

**Goal:** make the component API signal based, so the children can use `computed` too.

A `@Input()` is a plain field, so a `computed` cannot react to it. A signal `input()` is a read-only signal.

**Change** in the four child components. Remove `Input`, `Output` and `EventEmitter` from the imports.

| Before | After |
| --- | --- |
| `@Input({ required: true }) products: Product[] = []` | `products = input.required<Product[]>()` |
| `@Input() selected?: Product` | `selected = input<Product>()` |
| `@Output() pick = new EventEmitter<Product>()` | `pick = output<Product>()` |
| `@Input() lines: CartLine[] = []` | `lines = input<CartLine[]>([])` |

Also convert `product` and `add` in `ProductDetail`, and `value` / `valueChange` in `QuantityPicker`. In the templates, read the inputs with `()`.

Then use the new power in two places:

- In `Cart`, replace the `total` getter by a `computed` over `this.lines()`.
- In `ProductDetail`, add `subtotal = computed(() => (this.product()?.price ?? 0) * this.quantity())` and show it next to the picker:

```html
<span class="subtotal">{{ subtotal() | currency: 'EUR' }}</span>
```

Inside `@if (product(); as product) { ... }` you get a plain, non-null `product` for the block. In `addToCart()` read the signal once: `const product = this.product();`.

**Check:** the detail panel shows a subtotal that follows the quantity and the product. The cart total is correct.

**Why:** `input.required` has no default value and fails at compile time if the parent forgets it. `output()` is a lighter `EventEmitter`.

Solution: `step-3`.

## Step 4: `model`

**Goal:** replace an `input` + `output` pair for two-way binding with one `model`.

`QuantityPicker` has `value = input(1)` and `valueChange = output<number>()`. This pair is what makes `[(value)]="quantity"` work. A `model()` is both in one: a writable signal that notifies the parent when you set it.

**Change** in `quantity-picker.ts`:

```ts
value = model(1);

change(delta: number) {
  this.value.update((value) => value + delta);
}
```

The parent, `ProductDetail`, does not change: `[(value)]="quantity"` binds to a writable signal.

**Check:** the picker still works, and the subtotal follows.

Solution: `step-4`.

## Step 5: `effect`

**Goal:** run a side effect when a signal changes. Here: remember the cart in `localStorage`.

An `effect` runs once, then again whenever a signal it read has changed. It is for things that leave the signal world: storage, logging, a canvas, a third party library. It is **not** for deriving state (use `computed`).

**Change** in `app.ts`:

1. Add a helper to read the saved cart, and use it as the initial value:

```ts
const CART_KEY = 'mini-webshop-cart';

function loadCart(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
  } catch {
    return [];
  }
}

cart = signal<CartLine[]>(loadCart());
```

2. Create the effect in a constructor (it needs an injection context):

```ts
constructor() {
  effect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(this.cart()));
  });
}
```

**Check:** add something to the cart and reload the browser page. The cart is still there. See it in the dev tools under Application > Local storage.

**Think about it:** what if the effect also read another signal, say `category()`, only to log it? The effect would then run on every category change as well. Wrap such a read in `untracked(() => this.category())` so it does not become a dependency.

Solution: `step-5`.

## Step 6: `resource`

**Goal:** replace the hand written loading code with a `resource`.

Look at `load()`, `loading`, `error` and `setCategory()` in `app.ts`. That is a lot of code for one async value, and it has the race condition. A `resource` does this for you: it loads again when its `params` signals change and ignores stale results.

**Change** in `app.ts`:

```ts
products = resource({
  params: () => ({ category: this.category() }),
  loader: ({ params }) => fetchProducts(params.category, this.simulateError()),
});
```

- Delete `products`, `loading` and `error` (the old signals), `ngOnInit()`, `load()` and `setCategory()`. `OnInit` is no longer needed.
- Let the category buttons call `category.set(c)`.
- In the template, use the resource state:

| Old | New |
| --- | --- |
| `loading()` | `products.isLoading()` |
| `error()` | `products.error()` |
| `products()` | `products.value() ?? []` |
| `(click)="load()"` on `reload` | `(click)="products.reload()"` |

**Check:**

- Click a category: the list shows `loading...` and then the products.
- Click `books` and `music` quickly: you always end with the music list.
- Tick `simulate error` and click `reload`: you see the error message. Untick and `reload` to recover.

**Why:** `simulateError()` is read inside `loader`, and a loader is not tracked. That is why you must click `reload` after ticking the box. Only what is in `params` triggers a new load. Try moving it into `params` and see what changes.

**Go further:** for plain HTTP calls there is `httpResource(() => '/products.json')`, which uses `HttpClient` and its interceptors. We use `resource` here because the backend is faked.

Solution: `step-6`.

## Step 7: `linkedSignal`

**Goal:** fix the two bugs from step 0.

A `linkedSignal` is a writable signal whose value is reset by a computation when its source changes. It is the right tool for state that is derived but that the user may override.

**Change:**

1. In `app.ts`, `selected` becomes the first product of the list. The user can still pick another one with `.set()`, but a new list resets it:

```ts
selected = linkedSignal(() => this.products.value()?.[0]);
```

(Remove the old `selected` signal. `select(product)` keeps working.)

2. In `product-detail.ts`, the quantity returns to 1 when another product is shown:

```ts
quantity = linkedSignal({ source: this.product, computation: () => 1 });
```

**Check:** switch category: the first product of the new list is selected. Select another product: the quantity is 1 again. The picker still works, because a `linkedSignal` can be bound with `[(value)]`.

Solution: `step-7`.

## Step 8: zoneless

**Goal:** remove `zone.js`.

All state is in signals now, so Angular knows exactly what to refresh. It no longer needs `zone.js` to guess when something may have changed.

**Change:**

1. Remove `ChangeDetectionStrategy.Eager` and its import from all five components. They are now `OnPush`, the default.
2. In `app.config.ts`, remove `provideZoneChangeDetection(...)`. A new Angular 22 app is zoneless without any provider.
3. In `angular.json`, remove `"polyfills": ["zone.js"]` from the build options.
4. `npm uninstall zone.js`.

**Check:** the app behaves the same and the build has no polyfills bundle. In the dev tools, `window.Zone` is `undefined`.

Solution: `step-8`.

## What you learned

| API | Use it for | Used in |
| --- | --- | --- |
| `signal` | state you own and write | `App`, `ProductDetail` |
| `computed` | read only derived state | cart count, subtotal, cart total |
| `input`, `input.required`, `output` | component API | all child components |
| `model` | two-way binding | `QuantityPicker` |
| `effect` | side effects outside the signal world | cart in `localStorage` |
| `resource` | async data that depends on signals | the product list |
| `linkedSignal` | derived state the user can override | selected product, quantity |

Rule of thumb: derive with `computed`, write with `signal`, use `effect` only when you must leave the signal world.

## Go further

- Replace `resource` with `httpResource` and a real `HttpClient` call.
- Make `ProductList` filter with a search box (`signal` + `computed`).
- Show `products.status()` in the UI and try the `reload` state.
- Add a `computed` that sorts the cart lines by name.
