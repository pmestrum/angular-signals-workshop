import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

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
  value = input(1);
  valueChange = output<number>();

  change(delta: number) {
    this.valueChange.emit(this.value() + delta);
  }
}
