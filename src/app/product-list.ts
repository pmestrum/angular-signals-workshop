import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Product } from './product.model';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-product-list',
  imports: [CurrencyPipe],
  template: `
    <ul>
      @for (product of products(); track product.id) {
        <li [class.selected]="product.id === selected()?.id">
          <span class="name">{{ product.name }}</span>
          <span class="pill">{{ product.category }}</span>
          <span class="price">{{ product.price | currency: 'EUR' }}</span>
          <button (click)="pick.emit(product)">select</button>
        </li>
      } @empty {
        <li class="hint">no products</li>
      }
    </ul>
  `,
  styles: `
    ul { list-style: none; margin: 0; padding: 0; }
    li { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 8px; }
    li.selected { background: #fdeceb; }
    .name { flex: 1; }
    .price { min-width: 64px; text-align: right; }
  `,
})
export class ProductList {
  products = input.required<Product[]>();
  selected = input<Product>();
  pick = output<Product>();
}
