export const STORE_CATEGORIES = [
  'Clothing & Fashion',
  'Hair & Beauty',
  'Perfumes',
  'Wholesale & Bulk',
  'Phones & Electronics',
  'Home Furniture & Interior',
  'Machines & Business Equipment',
]

export function storeCategories(products = []) {
  return [...new Set([...STORE_CATEGORIES, ...products.map(product => product.category).filter(Boolean)])]
}
