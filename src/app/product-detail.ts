import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CartLine, Product } from './product.model';
import { QuantityPicker } from './quantity-picker';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-product-detail',
  imports: [CurrencyPipe, QuantityPicker],
  template: `
    @if (product) {
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
  @Input() product?: Product;
  @Output() add = new EventEmitter<CartLine>();
  quantity = 1;

  addToCart() {
    if (this.product) {
      this.add.emit({ product: this.product, quantity: this.quantity });
    }
  }
}
