import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from './product.model';
import { firstValueFrom } from 'rxjs';

@Injectable({providedIn: 'root'})
export class ProductsService {
  private readonly http = inject(HttpClient);

  async getProducts(category: string, textSearch: string, simulateError: boolean) {
    const products = await firstValueFrom(this.http.get<Product[]>('products.json'));

    await new Promise((resolve) => setTimeout(resolve, 600));
    if (simulateError) {
      throw new Error('simulated error');
    }
    // const products: Product[] = await response.json();
    const filtered = category === 'all' ? products : products.filter((p) => p.category === category);
    return textSearch ? filtered.filter((p) => p.name.toLowerCase().includes(textSearch.toLowerCase())) : filtered;
  }
}
