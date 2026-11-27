import { HttpClient } from '@angular/common/http';
import { Component, computed, effect, inject, linkedSignal, model, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Cart } from './cart';
import { CartLine, Product } from './product.model';
import { ProductDetail } from './product-detail';
import { ProductList } from './product-list';
import { ProductsService } from './products.service';
import { fetchProducts } from './products.api';

const CART_KEY = 'cart';

function loadCart(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
  } catch {
    return [];
  }
}

@Component({
  selector: 'app-root',
  imports: [ProductList, ProductDetail, Cart, FormsModule],
  template: `
      <header>
          <img src="delaware.svg" alt="delaware"/>
          <h1>mini webshop</h1>
          <span class="pill count">cart: {{ cartCount() }}</span>
      </header>

      <nav>
          @for (c of categories(); track c) {
              <button [class.active]="c === category()" (click)="category.set(c)">{{ c }}</button>
          }
          <input type="text" [(ngModel)]="textSearch">
          <span class="spacer"></span>
          <label>
              <input #fail type="checkbox" (change)="simulateError.set(fail.checked)"/>
              simulate error
          </label>
          <button (click)="products.reload()">reload</button>
      </nav>

      <main>
          <section class="card products">
              <h2>products</h2>
              @if (products.isLoading()) {
                  <p class="hint">loading...</p>
              } @else if (products.error()) {
                  <p class="error">could not load the products</p>
              } @else {
                  <app-product-list [products]="products.value() ?? []" [selected]="selected()" (pick)="select($event)"/>
              }
          </section>

          <section class="card detail">
              <h2>selected product</h2>
              <app-product-detail [product]="selected()" (add)="addToCart($event)"/>
          </section>

          <section class="card cart">
              <h2>cart</h2>
              <app-cart [lines]="cart()" (remove)="removeFromCart($event)"/>
          </section>
      </main>
  `,
  styles: `
      :host {
          display: flex;
          flex-direction: column;
          width: 800px;
          height: 600px;
          overflow: hidden;
      }

      header {
          display: flex;
          align-items: center;
          gap: 16px;
          height: 56px;
          padding: 0 16px;
          border-bottom: 1px solid var(--border);
      }

      header img {
          height: 26px;
      }

      header h1 {
          flex: 1;
          margin: 0;
          font-size: 22px;
          font-weight: normal;
          color: var(--dot-red);
      }

      nav {
          display: flex;
          align-items: center;
          gap: 8px;
          height: 44px;
          padding: 0 16px;
      }

      .spacer {
          flex: 1;
      }

      label {
          font-size: 13px;
          color: var(--grey);
      }

      main {
          flex: 1;
          display: grid;
          grid-template-columns: 380px 1fr;
          grid-template-rows: 190px 1fr;
          gap: 12px;
          padding: 0 16px 16px;
          min-height: 0;
      }

      .products {
          grid-row: 1 / 3;
          overflow: auto;
      }

      .cart {
          overflow: auto;
      }
  `,
})
export class App {
  categories = signal(['all', 'books', 'games', 'music']);
  category = signal('all');

  simulateError = signal(false);
  selected = linkedSignal(() => this.products.value()?.[0]);
  cart = signal<CartLine[]>(loadCart());

  textSearch = model<string>('');

  cartCount = computed(() => this.cart().reduce((count, line) => count + line.quantity, 0));

  private readonly productsService = inject(ProductsService);

  products = resource({
    params: () => ({ category: this.category(), textSearch: this.textSearch() }),
       loader: ({ params }) => this.productsService.getProducts(params.category, params.textSearch, this.simulateError()),})

  // products = toSignal(
  //   toObservable(this.textSearch).pipe(
  //     debounceTime(300),
  //     switchMap(q => this.http.get<Product[]>(`/api/items?q=${q}`))),
  //   { initialValue: [] });

  constructor() {
    effect(() => {
      localStorage.setItem(CART_KEY, JSON.stringify(this.cart()));
    });
  }

  select(product: Product) {
    this.selected.set(product);
  }

  addToCart(line: CartLine) {
    this.cart.update(cart => {
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
    this.cart.update(cart => cart.filter((l) => l.product.id !== productId));
  }
}
