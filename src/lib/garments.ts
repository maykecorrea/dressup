export interface Garment {
  id: string;
  name: string;
  imageSrc: string;
  purchaseLink: string;
  aiHint: string;
}

export const garments: Garment[] = [
  {
    id: 'tshirt-classic-white',
    name: 'Classic White T-Shirt',
    imageSrc: 'https://placehold.co/400x500.png',
    purchaseLink: 'https://example.com/products/tshirt-classic-white',
    aiHint: 'white t-shirt fashion',
  },
  {
    id: 'denim-jacket-blue',
    name: 'Blue Denim Jacket',
    imageSrc: 'https://placehold.co/400x500.png',
    purchaseLink: 'https://example.com/products/denim-jacket-blue',
    aiHint: 'denim jacket',
  },
  {
    id: 'floral-dress-summer',
    name: 'Summer Floral Dress',
    imageSrc: 'https://placehold.co/400x500.png',
    purchaseLink: 'https://example.com/products/floral-dress-summer',
    aiHint: 'floral dress',
  },
  {
    id: 'black-leather-jacket',
    name: 'Black Leather Jacket',
    imageSrc: 'https://placehold.co/400x500.png',
    purchaseLink: 'https://example.com/products/black-leather-jacket',
    aiHint: 'leather jacket',
  },
  {
    id: 'striped-sweater-cozy',
    name: 'Cozy Striped Sweater',
    imageSrc: 'https://placehold.co/400x500.png',
    purchaseLink: 'https://example.com/products/striped-sweater-cozy',
    aiHint: 'striped sweater',
  },
];
