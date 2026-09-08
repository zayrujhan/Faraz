import os
import re
from datetime import date
from typing import List, Optional

import httpx
from sqlalchemy.orm import Session, joinedload

from app import models

SYSTEM_PROMPT = """You are an e-commerce customer support assistant for the Faraz marketplace.

Answer only questions related to: products, shipping, returns, orders, payments, and categories.

Rules:
- Use ONLY the retrieved context below. Do not invent products, prices, stock levels, or order statuses.
- If the context does not contain enough information, say you do not have that information and suggest contacting support.
- When listing products, include each product ID in the format "Product #123" so the storefront can link to it.
- Be concise and helpful.
"""

# If the user message does not contain any of these terms, we refuse to call the LLM and save tokens.
RELEVANT_KEYWORDS = {
    "product", "products", "item", "items", "order", "orders", "cart", "checkout", "payment", "payments",
    "shipping", "delivery", "ship", "track", "return", "refund", "exchange", "category", "categories",
    "stock", "price", "buy", "purchase", "shop", "store", "seller", "account", "help", "support",
    "faraz", "recommend", "suggest", "find", "search", "looking for", "want", "need", "cheap", "expensive",
    "under", "over", "less than", "more than", "discount", "offer", "deal",
}


def is_relevant_question(message: str) -> bool:
    """Lightweight guard to avoid burning tokens on off-topic questions."""
    if not message:
        return False
    words = set(re.sub(r"[^a-z0-9\s]", "", message.lower()).split())
    # Allow single-word greetings if they are not standalone unrelated questions.
    if len(words) <= 1:
        return True
    return any(kw in message.lower() for kw in RELEVANT_KEYWORDS) or bool(words & RELEVANT_KEYWORDS)


def get_or_create_chat_usage(db: Session, user_id: int) -> models.ChatUsage:
    today = date.today()
    usage = (
        db.query(models.ChatUsage)
        .filter(models.ChatUsage.user_id == user_id, models.ChatUsage.date == today)
        .first()
    )
    if not usage:
        usage = models.ChatUsage(user_id=user_id, date=today, message_count=0)
        db.add(usage)
        db.flush()
    return usage


def _search_products(db: Session, message: str, limit: int = 5) -> List[models.Product]:
    terms = [t.strip() for t in message.split() if len(t.strip()) > 2][:5]
    query = db.query(models.Product).filter(models.Product.is_active.is_(True))
    if terms:
        filters = []
        for term in terms:
            pattern = f"%{term}%"
            filters.append(models.Product.name.ilike(pattern))
            filters.append(models.Product.description.ilike(pattern))
        from sqlalchemy import or_

        query = query.filter(or_(*filters))
    return query.limit(limit).all()


def _format_product_context(products: List[models.Product]) -> str:
    if not products:
        return "No matching products found."
    lines = []
    for p in products:
        lines.append(
            f"- {p.name} (id={p.id}, price={p.price}, stock={p.stock}, category_id={p.category_id})"
        )
    return "\n".join(lines)


def _format_orders_context(orders: List[models.Order]) -> str:
    if not orders:
        return "No orders found for this user."
    lines = []
    for order in orders:
        item_lines = []
        for item in order.items:
            item_lines.append(
                f"  * {item.product.name if item.product else 'Product'} x{item.quantity} status={item.status}"
            )
        lines.append(
            f"Order #{order.id} status={order.status} total={order.total_amount} created={order.created_at}\n"
            + "\n".join(item_lines)
        )
    return "\n".join(lines)


def _format_categories_context(categories: List[models.Category]) -> str:
    if not categories:
        return "No categories available."
    return "\n".join(f"- {c.name} (id={c.id}, parent_id={c.parent_id})" for c in categories[:15])


def build_retrieval_context(db: Session, message: str, user_id: Optional[int]) -> str:
    products = _search_products(db, message)
    categories = db.query(models.Category).limit(15).all()
    parts = [
        "PRODUCTS:",
        _format_product_context(products),
        "",
        "CATEGORIES:",
        _format_categories_context(categories),
    ]
    if user_id is not None:
        orders = (
            db.query(models.Order)
            .filter(models.Order.user_id == user_id)
            .options(joinedload(models.Order.items).joinedload(models.OrderItem.product))
            .order_by(models.Order.created_at.desc())
            .limit(5)
            .all()
        )
        parts.extend(["", "USER ORDERS:", _format_orders_context(orders)])
    return "\n".join(parts)


async def generate_chat_reply(
    db: Session,
    message: str,
    user_id: int,
) -> str:
    api_key = (os.getenv("LLM_API_KEY") or "").strip()
    base_url = os.getenv("LLM_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/")
    model = os.getenv("LLM_MODEL", "deepseek/deepseek-v4-flash-0731")
    site_url = os.getenv("OPENROUTER_SITE_URL", "http://localhost:8000")

    context = build_retrieval_context(db, message, user_id)
    user_content = f"Customer question: {message}\n\nRetrieved context:\n{context}"

    if not api_key:
        return (
            "Support chat is not configured yet (missing LLM_API_KEY). "
            "Please browse products at /products/ or check your orders after logging in."
        )

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.2,
        "max_tokens": 500,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": site_url,
        "X-Title": "Faraz E-Commerce API",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return (
            "Sorry, the support assistant is temporarily unavailable. "
            "Please try again later or contact support@example.com."
        )
