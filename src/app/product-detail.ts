import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Input, linkedSignal, output, Output, signal } from '@angular/core';
import { CartLine, Product } from './product.model';
import { QuantityPicker } from './quantity-picker';

@Component({
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
        <button class="primary" (click)="addToCart()">add to cart</button>
      </div>
    } @else {
      <p class="hint">select a product</p>
    }
  `,
  styles: `
    h3 { margin: 0 0 8px; }
    .row { display: flex; align-items: center; gap: 16px; }
  `,
})
export class ProductDetail {
  product = input<Product>();
  add = output<CartLine>();
  quantity = linkedSignal({ source: this.product, computation: () => 1 });
  addToCart() {
    const product = this.product();
    if (product) {
      this.add.emit({ product, quantity: this.quantity() });
    }
  }
}
