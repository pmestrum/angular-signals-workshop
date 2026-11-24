import { ChangeDetectionStrategy, Component, model } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-quantity-picker',
  template: `
    <button (click)="change(-1)" [disabled]="value() <= 1">-</button>
    <span class="value">{{ value() }}</span>
    <button (click)="change(1)" [disabled]="value() >= 9">+</button>
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 8px; }
    .value { min-width: 1.5em; text-align: center; font-weight: bold; }
  `,
})
export class QuantityPicker {
  value = model(1);

  change(delta: number) {
    this.value.update((value) => value + delta);
  }
}
