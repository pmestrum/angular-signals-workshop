export type Category = 'books' | 'games' | 'music';

export interface Product {
  id: number;
  name: string;
  category: Category;
  price: number;
}

export interface CartLine {
  product: Product;
  quantity: number;
}
