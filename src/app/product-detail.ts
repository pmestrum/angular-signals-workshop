import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CartLine, Product } from './product.model';
import { QuantityPicker } from './quantity-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-product-detail',
  imports: [CurrencyPipe, QuantityPicker],
  template: `
    @if (product(); as product) {
      <h3>{{ product.name }}</h3>
      <p>
        <span class="pill">{{ product.category }}</span>
        {{ product.price | currency: 'EUR' }}
      </p>
      <div class="row">
        <app-quantity-picker [(value)]="quantity" />
        <span class="subtotal">{{ subtotal() | currency: 'EUR' }}</span>
        <button class="primary" (click)="addToCart()">add to cart</button>
      </div>
    } @else {
      <p class="hint">select a product</p>
    }
  `,
  styles: `
    h3 { margin: 0 0 8px; }
    .row { display: flex; align-items: center; gap: 16px; }
    .subtotal { flex: 1; text-align: right; }
  `,
})
export class ProductDetail {
  product = input<Product>();
  add = output<CartLine>();
  quantity = signal(1);
  subtotal = computed(() => (this.product()?.price ?? 0) * this.quantity());

  addToCart() {
    const product = this.product();
    if (product) {
      this.add.emit({ product, quantity: this.quantity() });
    }
  }
}
