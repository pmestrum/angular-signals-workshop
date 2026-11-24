# Signals workshop webshop

A tiny webshop used to teach Angular signals. It starts as a baseline without signals and is converted in steps.

## Language

**Catalog**:
The list of products the shop offers, served by a fake backend (a static JSON file with a delay).
_Avoid_: Inventory, store

**Product**:
An item in the catalog with a name, a category and a price in EUR.
_Avoid_: Item, article

**Category**:
One of books, games or music. A catalog view shows one category or all.
_Avoid_: Type, genre

**Selected product**:
The product shown in the detail panel. Following a catalog change it falls back to the first product.
_Avoid_: Current product, active product

**Quantity**:
How many units of the selected product the student is about to add. Between 1 and 9.
_Avoid_: Amount, count

**Cart**:
The products the student has chosen to buy, kept between page reloads. There is no checkout.
_Avoid_: Basket, order

**Cart line**:
One product with its quantity in the cart. Adding the same product again increases its quantity, up to 9.
_Avoid_: Cart item, entry

## Workshop

**Baseline**:
The starting application (`step-0`) that uses no signals and runs with zone.js.
_Avoid_: Start app, old version

**Step**:
One conversion that introduces one signal API. Each step has a git tag `step-N` that holds its solution.
_Avoid_: Exercise, chapter
