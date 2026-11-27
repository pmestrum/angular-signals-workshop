import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, EventEmitter, input, Input, output, Output } from '@angular/core';
import { CartLine } from './product.model';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe],
  template: `
    <ul>
      @for (line of lines(); track line.product.id) {
        <li>
          <span class="name">{{ line.product.name }}</span>
          <span>x {{ line.quantity }}</span>
          <span class="price">{{ line.product.price * line.quantity | currency: 'EUR' }}</span>
          <button (click)="remove.emit(line.product.id)" aria-label="remove">x</button>
        </li>
      } @empty {
        <li class="hint">your cart is empty</li>
      }
    </ul>
    <p class="total">total: {{ total() | currency: 'EUR' }}</p>
  `,
  styles: `
    ul { list-style: none; margin: 0; padding: 0; }
    li { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
    .name { flex: 1; }
    .price { min-width: 64px; text-align: right; }
    .total { margin: 8px 0 0; font-weight: bold; text-align: right; }
  `,
})
export class Cart {
  readonly lines = input<CartLine[]>([]);
  readonly remove = output<number>();

  readonly total = computed(() => this.lines().reduce((sum, line) => sum + line.product.price * line.quantity, 0));
}
