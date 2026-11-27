import { Product } from './product.model';

// Fake "backend": a static JSON file, an artificial delay and an optional failure.
// This file stays the same in every step of the workshop.
export async function fetchProducts(category: string, textSearch: string, fail = false): Promise<Product[]> {
  const response = await fetch('products.json');
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (fail) {
    throw new Error('simulated error');
  }
  const products: Product[] = await response.json();
  const filtered = category === 'all' ? products : products.filter((p) => p.category === category);
  return textSearch ? filtered.filter((p) => p.name.toLowerCase().includes(textSearch.toLowerCase())) : filtered;
}
