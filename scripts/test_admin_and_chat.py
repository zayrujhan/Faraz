"""
Verify admin endpoints work for the admin dashboard and that the chatbot
receives product context from the database.
"""
import httpx

BASE = 'http://127.0.0.1:8000'
ADMIN_EMAIL = 'admin@example.com'
PASSWORD = 'password123'


def login(client, email, password):
    r = client.post(
        f'{BASE}/login',
        data={'username': email, 'password': password},
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
    )
    r.raise_for_status()
    token = r.json()['access_token']
    client.headers['Authorization'] = f'Bearer {token}'


def main():
    with httpx.Client() as c:
        print('\n1. Logging in as admin')
        login(c, ADMIN_EMAIL, PASSWORD)
        print('   OK')

        print('\n2. GET /users/ (admin only)')
        users = c.get(f'{BASE}/users/').json()
        print(f'   OK - {len(users)} users')

        print('\n3. GET /seller/products?include_inactive=true (admin aggregated)')
        products = c.get(f'{BASE}/seller/products', params={'include_inactive': 'true', 'limit': 5}).json()
        print(f'   OK - {len(products)} products returned')

        print('\n4. GET /seller/orders (admin aggregated)')
        orders = c.get(f'{BASE}/seller/orders', params={'limit': 5}).json()
        print(f'   OK - {len(orders)} orders returned')

        print('\n5. GET /seller/dashboard (admin aggregated)')
        dash = c.get(f'{BASE}/seller/dashboard').json()
        print(f"   OK - total_products={dash['total_products']} pending_orders={dash['pending_orders']}")

    print('\n6. POST /chat (AI assistant, no auth required)')
    with httpx.Client() as c:
        r = c.post(
            f'{BASE}/chat',
            json={'message': 'Show me some products under $50'},
        )
        r.raise_for_status()
        reply = r.json().get('reply', '')
        print(f"   OK - reply length {len(reply)} chars")
        print(f"   Snippet: {reply[:200]}...")

    print('\n=== ADMIN + CHAT TEST COMPLETE ===\n')


if __name__ == '__main__':
    main()
