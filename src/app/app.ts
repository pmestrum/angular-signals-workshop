import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { Cart } from './cart';
import { CartLine, Product } from './product.model';
import { ProductDetail } from './product-detail';
import { ProductList } from './product-list';
import { fetchProducts } from './products.api';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-root',
  imports: [ProductList, ProductDetail, Cart],
  template: `
    <header>
      <img src="delaware.svg" alt="delaware" />
      <h1>mini webshop</h1>
      <span class="pill count">cart: {{ cartCount() }}</span>
    </header>

    <nav>
      @for (c of categories; track c) {
        <button [class.active]="c === category()" (click)="setCategory(c)">{{ c }}</button>
      }
      <span class="spacer"></span>
      <label>
        <input #fail type="checkbox" (change)="simulateError.set(fail.checked)" />
        simulate error
      </label>
      <button (click)="load()">reload</button>
    </nav>

    <main>
      <section class="card products">
        <h2>products</h2>
        @if (loading()) {
          <p class="hint">loading...</p>
        } @else if (error()) {
          <p class="error">could not load the products</p>
        } @else {
          <app-product-list [products]="products()" [selected]="selected()" (pick)="select($event)" />
        }
      </section>

      <section class="card detail">
        <h2>selected product</h2>
        <app-product-detail [product]="selected()" (add)="addToCart($event)" />
      </section>

      <section class="card cart">
        <h2>cart</h2>
        <app-cart [lines]="cart()" (remove)="removeFromCart($event)" />
      </section>
    </main>
  `,
  styles: `
    :host { display: flex; flex-direction: column; width: 800px; height: 600px; overflow: hidden; }
    header { display: flex; align-items: center; gap: 16px; height: 56px; padding: 0 16px; border-bottom: 1px solid var(--border); }
    header img { height: 26px; }
    header h1 { flex: 1; margin: 0; font-size: 22px; font-weight: normal; color: var(--dot-red); }
    nav { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px; }
    .spacer { flex: 1; }
    label { font-size: 13px; color: var(--grey); }
    main { flex: 1; display: grid; grid-template-columns: 380px 1fr; grid-template-rows: 190px 1fr; gap: 12px; padding: 0 16px 16px; min-height: 0; }
    .products { grid-row: 1 / 3; overflow: auto; }
    .cart { overflow: auto; }
  `,
})
export class App implements OnInit {
  categories = ['all', 'books', 'games', 'music'];
  category = signal('all');
  products = signal<Product[]>([]);
  loading = signal(false);
  error = signal(false);
  simulateError = signal(false);
  selected = signal<Product | undefined>(undefined);
  cart = signal<CartLine[]>([]);
  cartCount = computed(() => this.cart().reduce((count, line) => count + line.quantity, 0));

  ngOnInit() {
    this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.products.set(await fetchProducts(this.category(), this.simulateError()));
    } catch {
      this.products.set([]);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  setCategory(category: string) {
    this.category.set(category);
    this.load();
  }

  select(product: Product) {
    this.selected.set(product);
  }

  addToCart(line: CartLine) {
    this.cart.update((cart) => {
      const existing = cart.find((l) => l.product.id === line.product.id);
      if (existing) {
        return cart.map((l) =>
          l === existing ? { ...l, quantity: Math.min(9, l.quantity + line.quantity) } : l,
        );
      }
      return [...cart, line];
    });
  }

  removeFromCart(productId: number) {
    this.cart.update((cart) => cart.filter((l) => l.product.id !== productId));
  }
}
