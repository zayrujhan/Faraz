"""
Smoke and workflow tests for the Vend E-Commerce API.

Usage:
    python scripts/test_api.py
    python scripts/test_api.py --base-url http://127.0.0.1:8000
"""

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

BASE_URL = "http://127.0.0.1:8000"
CUSTOMER_EMAIL = "customer1@example.com"
SELLER_EMAIL = "seller1@example.com"
ADMIN_EMAIL = "admin@example.com"
PASSWORD = "password123"


class ApiClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.token = None

    def request(self, method, path, json_body=None, form_body=None, auth=False, expected=None):
        url = f"{self.base_url}{path}"
        headers = {"Accept": "application/json"}
        data = None

        if json_body is not None:
            data = json.dumps(json_body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        elif form_body is not None:
            data = urllib.parse.urlencode(form_body).encode("utf-8")
            headers["Content-Type"] = "application/x-www-form-urlencoded"

        if auth:
            if not self.token:
                raise RuntimeError("Auth requested but no token set")
            headers["Authorization"] = f"Bearer {self.token}"

        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                body = resp.read().decode("utf-8")
                status = resp.status
                payload = json.loads(body) if body else None
        except urllib.error.HTTPError as exc:
            status = exc.code
            body = exc.read().decode("utf-8")
            try:
                payload = json.loads(body)
            except json.JSONDecodeError:
                payload = {"raw": body}

        if expected is not None and status not in expected:
            raise AssertionError(f"{method} {path} -> {status}, expected {expected}, body={payload}")

        return status, payload

    def login(self, email, password):
        status, payload = self.request(
            "POST",
            "/login",
            form_body={"username": email, "password": password},
            expected={200},
        )
        self.token = payload["access_token"]
        return payload


def record(results, name, passed, detail=""):
    results.append({"test": name, "passed": passed, "detail": detail})
    mark = "PASS" if passed else "FAIL"
    print(f"[{mark}] {name}" + (f" — {detail}" if detail else ""))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=BASE_URL)
    args = parser.parse_args()

    client = ApiClient(args.base_url)
    results = []

    # Public endpoints
    try:
        status, payload = client.request("GET", "/", expected={200})
        record(results, "GET /", True, str(payload))
    except Exception as exc:
        record(results, "GET /", False, str(exc))
        print("\nServer not reachable. Start with: uvicorn app.main:app --reload")
        sys.exit(1)

    try:
        status, categories = client.request("GET", "/categories/", expected={200})
        record(results, "GET /categories/", isinstance(categories, list) and len(categories) > 0, f"count={len(categories)}")
    except Exception as exc:
        record(results, "GET /categories/", False, str(exc))
        categories = []

    try:
        status, products = client.request("GET", "/products/?limit=5", expected={200})
        record(results, "GET /products/", isinstance(products, list) and len(products) > 0, f"count={len(products)}")
    except Exception as exc:
        record(results, "GET /products/", False, str(exc))
        products = []

    product_id = products[0]["id"] if products else 1
    low_stock_product_id = None

    try:
        status, product = client.request("GET", f"/products/{product_id}", expected={200})
        record(results, "GET /products/{id}", product.get("id") == product_id)
    except Exception as exc:
        record(results, "GET /products/{id}", False, str(exc))

    # Category browsing check
    if categories and products:
        category_id = categories[0]["id"]
        in_category = [p for p in products if p.get("category_id") == category_id]
        has_category_filter_endpoint = False
        try:
            status, filtered = client.request("GET", f"/products/?category_id={category_id}", expected={200})
            if isinstance(filtered, list):
                has_category_filter_endpoint = all(p.get("category_id") == category_id for p in filtered)
        except Exception:
            has_category_filter_endpoint = False

        if has_category_filter_endpoint:
            record(results, "Catalog browse by category", True, f"category_id={category_id}")
        else:
            record(
                results,
                "Catalog browse by category",
                False,
                "No /products?category_id= filter; client must filter locally",
            )

        try:
            status, tree = client.request("GET", "/categories/tree", expected={200})
            has_children = isinstance(tree, list) and any(c.get("children") for c in tree)
            record(results, "GET /categories/tree", has_children or isinstance(tree, list))
        except Exception as exc:
            record(results, "GET /categories/tree", False, str(exc))

        if categories:
            cid = categories[0]["id"]
            try:
                client.request("GET", f"/categories/{cid}/children", expected={200})
                record(results, "GET /categories/{id}/children", True)
            except Exception as exc:
                record(results, "GET /categories/{id}/children", False, str(exc))

    # Auth + customer flow
    customer = ApiClient(args.base_url)
    try:
        customer.login(CUSTOMER_EMAIL, PASSWORD)
        record(results, "POST /login (customer)", True)
    except Exception as exc:
        record(results, "POST /login (customer)", False, str(exc))

    try:
        status, me = customer.request("GET", "/me", auth=True, expected={200})
        record(results, "GET /me", me.get("email") == CUSTOMER_EMAIL)
    except Exception as exc:
        record(results, "GET /me", False, str(exc))

    try:
        status, addresses = customer.request("GET", "/addresses/", auth=True, expected={200})
        record(results, "GET /addresses/", isinstance(addresses, list) and len(addresses) > 0)
    except Exception as exc:
        record(results, "GET /addresses/", False, str(exc))

    # Find a product with low stock for stock tests
    try:
        status, all_products = customer.request("GET", "/products/?limit=100", expected={200})
        for p in all_products:
            if p.get("stock", 0) <= 5:
                low_stock_product_id = p["id"]
                break
    except Exception:
        pass

    cart_item_id = None
    try:
        status, cart = customer.request("GET", "/cart/", auth=True, expected={200})
        record(results, "GET /cart/", "id" in cart)
    except Exception as exc:
        record(results, "GET /cart/", False, str(exc))

    cart_product_id = product_id
    try:
        status, stocked = customer.request("GET", "/products/?limit=50", expected={200})
        for p in stocked:
            if p.get("stock", 0) >= 1:
                cart_product_id = p["id"]
                break
    except Exception:
        pass

    try:
        status, item = customer.request(
            "POST",
            "/cart/items",
            json_body={"product_id": cart_product_id, "quantity": 1},
            auth=True,
            expected={200},
        )
        cart_item_id = item.get("id")
        record(results, "POST /cart/items (valid quantity)", cart_item_id is not None)
    except Exception as exc:
        record(results, "POST /cart/items (valid quantity)", False, str(exc))

    if low_stock_product_id:
        try:
            status, payload = customer.request(
                "POST",
                "/cart/items",
                json_body={"product_id": low_stock_product_id, "quantity": 9999},
                auth=True,
                expected={400},
            )
            detail = payload.get("detail", "") if isinstance(payload, dict) else str(payload)
            record(
                results,
                "POST /cart/items rejects over-stock",
                "insufficient" in detail.lower() or "stock" in detail.lower(),
                detail,
            )
        except Exception as exc:
            record(results, "POST /cart/items rejects over-stock", False, str(exc))
    elif products:
        try:
            pid = products[0]["id"]
            status, payload = customer.request(
                "POST",
                "/cart/items",
                json_body={"product_id": pid, "quantity": 999999},
                auth=True,
                expected={400},
            )
            detail = payload.get("detail", "") if isinstance(payload, dict) else str(payload)
            record(
                results,
                "POST /cart/items rejects over-stock",
                "insufficient" in detail.lower() or "stock" in detail.lower(),
                detail,
            )
        except Exception as exc:
            record(results, "POST /cart/items rejects over-stock", False, str(exc))
    else:
        record(results, "POST /cart/items rejects over-stock", False, "No products available")

    if cart_item_id:
        try:
            status, updated = customer.request(
                "PUT",
                f"/cart/items/{cart_item_id}?quantity=9999",
                auth=True,
                expected={200, 400},
            )
            if status == 400:
                record(results, "PUT /cart/items rejects over-stock on update", True)
            else:
                record(
                    results,
                    "PUT /cart/items rejects over-stock on update",
                    False,
                    "Update allowed quantity above stock",
                )
        except Exception as exc:
            record(results, "PUT /cart/items rejects over-stock on update", False, str(exc))

    order_id = None
    try:
        status, order = customer.request("POST", "/orders/", auth=True, expected={200})
        order_id = order.get("id")
        record(results, "POST /orders/ checkout", order_id is not None, f"order_id={order_id}")
    except Exception as exc:
        record(results, "POST /orders/ checkout", False, str(exc))

    try:
        status, orders = customer.request("GET", "/orders/", auth=True, expected={200})
        record(results, "GET /orders/", isinstance(orders, list))
    except Exception as exc:
        record(results, "GET /orders/", False, str(exc))

    if order_id:
        try:
            status, order = customer.request("GET", f"/orders/detail/{order_id}", auth=True, expected={200})
            record(results, "GET /orders/detail/{id}", order.get("id") == order_id)
        except Exception as exc:
            record(results, "GET /orders/detail/{id}", False, str(exc))

    try:
        status, wish = customer.request(
            "POST",
            "/wishlist/",
            json_body={"product_id": product_id},
            auth=True,
            expected={201},
        )
        wishlist_id = wish.get("id")
        record(results, "POST /wishlist/", wishlist_id is not None)
    except Exception as exc:
        record(results, "POST /wishlist/", False, str(exc))
        wishlist_id = None

    try:
        status, wishlist = customer.request("GET", "/wishlist/", auth=True, expected={200})
        record(results, "GET /wishlist/", isinstance(wishlist, list))
    except Exception as exc:
        record(results, "GET /wishlist/", False, str(exc))

    if wishlist_id:
        try:
            customer.request("DELETE", f"/wishlist/{wishlist_id}", auth=True, expected={204})
            record(results, "DELETE /wishlist/{id}", True)
        except Exception as exc:
            record(results, "DELETE /wishlist/{id}", False, str(exc))

    try:
        status, review = customer.request(
            "POST",
            "/reviews/",
            json_body={"product_id": product_id, "rating": 4, "comment": "API test review"},
            auth=True,
            expected={201},
        )
        record(results, "POST /reviews/", review.get("rating") == 4)
    except Exception as exc:
        record(results, "POST /reviews/", False, str(exc))

    try:
        status, reviews = customer.request("GET", f"/reviews/{product_id}", expected={200})
        record(results, "GET /reviews/{product_id}", isinstance(reviews, list))
    except Exception as exc:
        record(results, "GET /reviews/{product_id}", False, str(exc))

    # Seller flow
    seller = ApiClient(args.base_url)
    seller_products = []
    try:
        seller.login(SELLER_EMAIL, PASSWORD)
        status, seller_products = seller.request("GET", "/seller/products", auth=True, expected={200})
        record(results, "GET /seller/products", isinstance(seller_products, list))
    except Exception as exc:
        record(results, "GET /seller/products", False, str(exc))

    try:
        status, dashboard = seller.request("GET", "/seller/dashboard", auth=True, expected={200})
        record(results, "GET /seller/dashboard", "total_products" in dashboard)
    except Exception as exc:
        record(results, "GET /seller/dashboard", False, str(exc))

    try:
        status, summary = seller.request("GET", "/seller/sales-summary?days=30", auth=True, expected={200})
        record(results, "GET /seller/sales-summary", summary.get("days") == 30)
    except Exception as exc:
        record(results, "GET /seller/sales-summary", False, str(exc))

    try:
        status, seller_orders = seller.request("GET", "/seller/orders", auth=True, expected={200})
        record(results, "GET /seller/orders", isinstance(seller_orders, list))
    except Exception as exc:
        record(results, "GET /seller/orders", False, str(exc))

    if seller_products:
        pid = seller_products[0]["id"]
        try:
            seller.request(
                "PATCH",
                f"/seller/products/{pid}/stock",
                json_body={"stock": seller_products[0].get("stock", 1)},
                auth=True,
                expected={200},
            )
            record(results, "PATCH /seller/products/{id}/stock", True)
        except Exception as exc:
            record(results, "PATCH /seller/products/{id}/stock", False, str(exc))

    try:
        status, chat = client.request("POST", "/chat", json_body={"message": "What products do you sell?"}, expected={200})
        record(results, "POST /chat", isinstance(chat, dict) and "reply" in chat)
    except Exception as exc:
        record(results, "POST /chat", False, str(exc))

    # Admin flow
    admin = ApiClient(args.base_url)
    try:
        admin.login(ADMIN_EMAIL, PASSWORD)
        status, users = admin.request("GET", "/users/", auth=True, expected={200})
        record(results, "GET /users/ (admin)", isinstance(users, list) and len(users) > 0)
    except Exception as exc:
        record(results, "GET /users/ (admin)", False, str(exc))

    # Signup
    signup_email = "apitest_user@example.com"
    try:
        status, payload = client.request(
            "POST",
            "/signup",
            json_body={
                "name": "API Test User",
                "email": signup_email,
                "password": "password123",
                "role": "customer",
            },
            expected={201, 400},
        )
        record(results, "POST /signup", status in {201, 400}, "created or already exists")
    except Exception as exc:
        record(results, "POST /signup", False, str(exc))

    # Checkout stock validation probe: add more than stock then checkout
    checkout_stock_client = ApiClient(args.base_url)
    try:
        checkout_stock_client.login(CUSTOMER_EMAIL, PASSWORD)
        status, candidate_products = checkout_stock_client.request("GET", "/products/?limit=100", expected={200})
        test_product = next((p for p in candidate_products if p.get("stock", 0) >= 1), None)
        if test_product:
            pid = test_product["id"]
            stock = test_product["stock"]
            checkout_stock_client.request(
                "POST",
                "/cart/items",
                json_body={"product_id": pid, "quantity": stock},
                auth=True,
                expected={200},
            )
            status, payload = checkout_stock_client.request("POST", "/orders/", auth=True, expected={200, 400})
            if status == 200:
                # Try to order again without restock — should fail if stock decremented
                checkout_stock_client.request(
                    "POST",
                    "/cart/items",
                    json_body={"product_id": pid, "quantity": 1},
                    auth=True,
                    expected={200, 400},
                )
                status2, payload2 = checkout_stock_client.request("POST", "/orders/", auth=True, expected={200, 400})
                if status2 == 400:
                    record(results, "Checkout enforces stock depletion", True)
                else:
                    record(
                        results,
                        "Checkout enforces stock depletion",
                        False,
                        "Second checkout succeeded after stock should be exhausted; stock not decremented on order",
                    )
            else:
                record(results, "Checkout enforces stock depletion", False, str(payload))
        else:
            record(results, "Checkout enforces stock depletion", False, "No product with stock found")
    except Exception as exc:
        record(results, "Checkout enforces stock depletion", False, str(exc))

    passed = sum(1 for r in results if r["passed"])
    failed = len(results) - passed
    print(f"\nSummary: {passed} passed, {failed} failed, {len(results)} total")

    report_path = ROOT / "scripts" / "test_report.json"
    report_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"Report written to {report_path}")

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
