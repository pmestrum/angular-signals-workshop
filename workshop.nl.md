# Angular signals workshop

Taal: [English](workshop.md) | Nederlands

Je krijgt een kleine webshop die **helemaal geen signals gebruikt**. Stap voor stap zet je die om naar een volledig op signals gebaseerde Angular 22 app zonder zone.js. Elke stap introduceert één signal API.

Verwachte duur: ongeveer 90 minuten. De app is slechts 800 x 600 pixels groot, dus een klein browservenster volstaat.

## De app

- De header toont hoeveel items er in het winkelmandje zitten.
- De nav heeft knoppen per categorie, een `simulate error` checkbox en een `reload` knop.
- De productlijst toont de producten van de gekozen categorie (een nep backend: `public/products.json` met 600 ms vertraging).
- Kies een product om het in het detailpaneel te zien, kies een aantal (1 tot 9) en voeg het toe aan het mandje.
- Het mandje toont de lijnen met een totaal en laat je een lijn verwijderen.

Componenten (allemaal in `src/app`, met inline template en styles):

| Component | Rol |
| --- | --- |
| `App` | beheert de state: categorie, producten, gekozen product, mandje |
| `ProductList` | toont producten, meldt aan de parent welk product gekozen werd |
| `ProductDetail` | toont het gekozen product en het aantal, voegt toe aan het mandje |
| `QuantityPicker` | de `- 1 +` knoppen |
| `Cart` | toont de lijnen van het mandje en het totaal |

`products.api.ts` (de nep backend) verandert nooit. Raak ook `product.model.ts` niet aan.

## Opstarten

```bash
npm install
git checkout -b workshop step-0
npm start
```

Open http://localhost:4200.

Elke stap heeft een git tag. De tag `step-N` bevat de **oplossing van stap N**: `step-0` is je startpunt en `step-8` het eindresultaat. Zit je vast, vergelijk dan met de oplossing:

```bash
git diff step-3 -- src/app          # verschil tussen mijn werk en de oplossing
git diff step-2 step-3 -- src/app   # wat veranderde er in stap 3
```

Of gooi je werk weg en ga verder vanaf een oplossing: `git checkout -f step-3`.

## Stap 0: bekijk de basis

Start de app en probeer ze uit. Zoek daarna de twee bugs die er met opzet in zitten:

1. Kies een boek en klik dan op `games`. Het detailpaneel toont nog steeds het boek, ook al staat het niet meer in de lijst.
2. Kies een product, klik een paar keer op `+` en kies dan een ander product. Het aantal wordt niet teruggezet.

Klik ook snel na elkaar op categorieknoppen. De lijst kan het resultaat tonen van een eerder gestarte aanvraag (een race condition).

Open `src/app/app.ts`. Alle state zijn gewone klassevelden. Kijk naar de componenten: elk component heeft `changeDetection: ChangeDetectionStrategy.Eager`.

> **Waarom `Eager`?** Sinds Angular 22 is `OnPush` de standaard change detection strategie. Een component dat niet `OnPush` is, moet dat nu expliciet zeggen met `Eager`. Onze basis gebruikt gewone velden en `zone.js` en heeft dus `Eager` nodig om te verversen. Op het einde van de workshop zijn alle `Eager` regels verdwenen.

## Stap 1: `signal`

**Doel:** zet de state om naar signals.

Een `signal` is een doosje met een waarde. Je leest het door het aan te roepen, je schrijft met `.set()` of `.update()`. De template weet welke signals ze leest en ververst enkel wanneer die veranderen.

**Aanpassen** in `app.ts`:

- Maak van `category`, `products`, `loading`, `error`, `simulateError`, `selected` en `cart` een `signal(...)`. Geef de lege een type, bijvoorbeeld `signal<Product[]>([])` en `signal<Product | undefined>(undefined)`.
- Vervang elke schrijfactie `this.x = waarde` door `this.x.set(waarde)` en elke leesactie `this.x` door `this.x()`. Dit geldt ook voor de template en de `cartCount` getter.
- Gebruik voor `cart` `update` wanneer de nieuwe waarde van de oude afhangt:

```ts
this.cart.update((cart) => cart.filter((l) => l.product.id !== productId));
```

- Maak in `product-detail.ts` ook van `quantity` een `signal(1)`.

**Controleer:** de app gedraagt zich precies zoals voorheen.

**Waarom:** de app werkt nog omdat de template de signals leest. De bugs uit stap 0 zijn er nog. Die lossen we op in stap 7.

Oplossing: `step-1`.

## Stap 2: `computed`

**Doel:** leid een waarde af in plaats van ze telkens opnieuw te berekenen.

`cartCount` in `app.ts` is een getter die bij elke change detection opnieuw rekent. Een `computed` rekent lazy, bewaart het resultaat en rekent enkel opnieuw als een gelezen signal veranderd is.

**Aanpassen:**

```ts
cartCount = computed(() => this.cart().reduce((count, line) => count + line.quantity, 0));
```

Gebruik `cartCount()` in de template.

**Controleer:** het `cart: n` label in de header wordt nog steeds bijgewerkt.

**Waarom:** je "update" een computed nooit. Ze is read only. Je geeft de afhankelijkheden niet op: ze worden ontdekt wanneer de computed draait.

Oplossing: `step-2`.

## Stap 3: `input`, `input.required` en `output`

**Doel:** maak de API van de componenten signal based, zodat ook de kinderen `computed` kunnen gebruiken.

Een `@Input()` is een gewoon veld, dus een `computed` kan er niet op reageren. Een signal `input()` is een read only signal.

**Aanpassen** in de vier kindcomponenten. Verwijder `Input`, `Output` en `EventEmitter` uit de imports.

| Voor | Na |
| --- | --- |
| `@Input({ required: true }) products: Product[] = []` | `products = input.required<Product[]>()` |
| `@Input() selected?: Product` | `selected = input<Product>()` |
| `@Output() pick = new EventEmitter<Product>()` | `pick = output<Product>()` |
| `@Input() lines: CartLine[] = []` | `lines = input<CartLine[]>([])` |

Zet ook `product` en `add` in `ProductDetail` om, en `value` / `valueChange` in `QuantityPicker`. Lees de inputs in de templates met `()`.

Gebruik daarna de nieuwe kracht op twee plaatsen:

- Vervang in `Cart` de `total` getter door een `computed` over `this.lines()`.
- Voeg in `ProductDetail` `subtotal = computed(() => (this.product()?.price ?? 0) * this.quantity())` toe en toon het naast de picker:

```html
<span class="subtotal">{{ subtotal() | currency: 'EUR' }}</span>
```

Binnen `@if (product(); as product) { ... }` krijg je een gewoon, niet-null `product` voor het blok. Lees in `addToCart()` de signal één keer: `const product = this.product();`.

**Controleer:** het detailpaneel toont een subtotaal dat het aantal en het product volgt. Het totaal van het mandje klopt.

**Waarom:** `input.required` heeft geen standaardwaarde en geeft een compilatiefout als de parent de waarde vergeet. `output()` is een lichtere `EventEmitter`.

Oplossing: `step-3`.

## Stap 4: `model`

**Doel:** vervang een `input` + `output` paar voor two-way binding door één `model`.

`QuantityPicker` heeft `value = input(1)` en `valueChange = output<number>()`. Dit paar laat `[(value)]="quantity"` werken. Een `model()` is beide in één: een schrijfbare signal die de parent verwittigt wanneer je ze zet.

**Aanpassen** in `quantity-picker.ts`:

```ts
value = model(1);

change(delta: number) {
  this.value.update((value) => value + delta);
}
```

De parent, `ProductDetail`, verandert niet: `[(value)]="quantity"` bindt aan een schrijfbare signal.

**Controleer:** de picker werkt nog en het subtotaal volgt.

Oplossing: `step-4`.

## Stap 5: `effect`

**Doel:** voer een neveneffect uit wanneer een signal verandert. Hier: het mandje bewaren in `localStorage`.

Een `effect` draait een eerste keer en daarna telkens een gelezen signal verandert. Hij dient voor zaken buiten de signal wereld: opslag, logging, een canvas, een externe library. Hij is **niet** bedoeld om state af te leiden (gebruik `computed`).

**Aanpassen** in `app.ts`:

1. Voeg een helper toe die het bewaarde mandje leest, en gebruik die als beginwaarde:

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

2. Maak de effect in een constructor (hij heeft een injection context nodig):

```ts
constructor() {
  effect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(this.cart()));
  });
}
```

**Controleer:** voeg iets toe aan het mandje en herlaad de pagina. Het mandje is er nog. Bekijk het in de dev tools onder Application > Local storage.

**Denk na:** wat als de effect ook een andere signal las, bijvoorbeeld `category()`, enkel om te loggen? Dan zou de effect ook bij elke categoriewissel draaien. Verpak zo'n lezing in `untracked(() => this.category())` zodat ze geen afhankelijkheid wordt.

Oplossing: `step-5`.

## Stap 6: `resource`

**Doel:** vervang de zelfgeschreven laadcode door een `resource`.

Kijk naar `load()`, `loading`, `error` en `setCategory()` in `app.ts`. Dat is veel code voor één asynchrone waarde en ze heeft de race condition. Een `resource` doet dit voor je: ze laadt opnieuw wanneer haar `params` signals veranderen en negeert verouderde resultaten.

**Aanpassen** in `app.ts`:

```ts
products = resource({
  params: () => ({ category: this.category() }),
  loader: ({ params }) => fetchProducts(params.category, this.simulateError()),
});
```

- Verwijder `products`, `loading` en `error` (de oude signals), `ngOnInit()`, `load()` en `setCategory()`. `OnInit` is niet meer nodig.
- Laat de categorieknoppen `category.set(c)` aanroepen.
- Gebruik in de template de state van de resource:

| Oud | Nieuw |
| --- | --- |
| `loading()` | `products.isLoading()` |
| `error()` | `products.error()` |
| `products()` | `products.value() ?? []` |
| `(click)="load()"` op `reload` | `(click)="products.reload()"` |

**Controleer:**

- Klik op een categorie: de lijst toont `loading...` en daarna de producten.
- Klik snel op `books` en `music`: je eindigt altijd met de muzieklijst.
- Vink `simulate error` aan en klik op `reload`: je ziet de foutmelding. Vink uit en `reload` om te herstellen.

**Waarom:** `simulateError()` wordt in de `loader` gelezen en een loader wordt niet gevolgd. Daarom moet je na het aanvinken op `reload` klikken. Enkel wat in `params` staat, start een nieuwe lading. Probeer het eens in `params` te zetten en kijk wat er verandert.

**Verder gaan:** voor gewone HTTP aanroepen bestaat `httpResource(() => '/products.json')`, die `HttpClient` en zijn interceptors gebruikt. Hier gebruiken we `resource` omdat de backend nagebootst is.

Oplossing: `step-6`.

## Stap 7: `linkedSignal`

**Doel:** los de twee bugs uit stap 0 op.

Een `linkedSignal` is een schrijfbare signal waarvan de waarde door een berekening wordt teruggezet wanneer haar bron verandert. Ze is het juiste gereedschap voor afgeleide state die de gebruiker mag overschrijven.

**Aanpassen:**

1. In `app.ts` wordt `selected` het eerste product van de lijst. De gebruiker kan nog steeds een ander kiezen met `.set()`, maar een nieuwe lijst zet het terug:

```ts
selected = linkedSignal(() => this.products.value()?.[0]);
```

(Verwijder de oude `selected` signal. `select(product)` blijft werken.)

2. In `product-detail.ts` gaat het aantal terug naar 1 wanneer een ander product getoond wordt:

```ts
quantity = linkedSignal({ source: this.product, computation: () => 1 });
```

**Controleer:** wissel van categorie: het eerste product van de nieuwe lijst is gekozen. Kies een ander product: het aantal is weer 1. De picker werkt nog, want een `linkedSignal` kan gebonden worden met `[(value)]`.

Oplossing: `step-7`.

## Stap 8: zonder zone

**Doel:** verwijder `zone.js`.

Alle state zit nu in signals, dus Angular weet precies wat het moet verversen. Het heeft `zone.js` niet meer nodig om te raden wanneer iets veranderd kan zijn.

**Aanpassen:**

1. Verwijder `ChangeDetectionStrategy.Eager` en de import ervan uit alle vijf de componenten. Ze zijn nu `OnPush`, de standaard.
2. Verwijder in `app.config.ts` `provideZoneChangeDetection(...)`. Een nieuwe Angular 22 app is zonder zone zonder enige provider.
3. Verwijder in `angular.json` `"polyfills": ["zone.js"]` uit de build opties.
4. `npm uninstall zone.js`.

**Controleer:** de app gedraagt zich hetzelfde en de build heeft geen polyfills bundel. In de dev tools is `window.Zone` `undefined`.

Oplossing: `step-8`.

## Wat heb je geleerd

| API | Gebruik voor | Gebruikt in |
| --- | --- | --- |
| `signal` | state die je zelf bezit en schrijft | `App`, `ProductDetail` |
| `computed` | read only afgeleide state | aantal in mandje, subtotaal, totaal |
| `input`, `input.required`, `output` | API van een component | alle kindcomponenten |
| `model` | two-way binding | `QuantityPicker` |
| `effect` | neveneffecten buiten de signal wereld | mandje in `localStorage` |
| `resource` | asynchrone data die van signals afhangt | de productlijst |
| `linkedSignal` | afgeleide state die de gebruiker mag overschrijven | gekozen product, aantal |

Vuistregel: leid af met `computed`, schrijf met `signal` en gebruik `effect` enkel als je de signal wereld moet verlaten.

## Verder gaan

- Vervang `resource` door `httpResource` en een echte `HttpClient` aanroep.
- Laat `ProductList` filteren met een zoekvak (`signal` + `computed`).
- Toon `products.status()` in de UI en probeer de `reload` toestand.
- Voeg een `computed` toe die de lijnen van het mandje op naam sorteert.
