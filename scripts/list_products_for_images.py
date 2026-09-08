import urllib.request
import json

BASE = 'http://127.0.0.1:8000'


def fetch(path, params=None):
    url = f'{BASE}{path}'
    if params:
        query = '&'.join(f'{k}={v}' for k, v in params.items())
        url = f'{url}?{query}'
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read().decode())


def main():
    products = fetch('/products/', {'limit': 15})
    cats = {c['id']: c for c in fetch('/categories/')}

    print('\n15 products ready for real images:\n')
    header = f"{'ID':<5} {'Name':<35} {'Price':<10} {'Stock':<6} {'Category':<18} {'Subcategory':<18} {'Seller':<20} {'Seller Email':<25}"
    print(header)
    print('-' * len(header))
    for p in products:
        cat = cats.get(p.get('category_id'), {})
        parent = cats.get(cat.get('parent_id'), {})
        seller = p.get('seller') or {}
        print(
            f"{p['id']:<5} {p['name'][:34]:<35} ${p['price']:<9.2f} {p['stock']:<6} "
            f"{parent.get('name', '')[:17]:<18} {cat.get('name', '')[:17]:<18} "
            f"{seller.get('name', '')[:19]:<20} {seller.get('email', '')[:24]:<25}"
        )
    print('\nUpload images to: POST /seller/products/{id}/images (multipart/form-data, field "file")')


if __name__ == '__main__':
    main()
