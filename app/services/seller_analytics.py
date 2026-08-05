import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.constants import COMPLETED_ORDER_ITEM_STATUSES, PENDING_ORDER_ITEM_STATUSES


def _low_stock_threshold() -> int:
    return int(os.getenv("LOW_STOCK_THRESHOLD", "10"))


def _seller_product_query(db: Session, seller_id: Optional[int]):
    query = db.query(models.Product)
    if seller_id is not None:
        query = query.filter(models.Product.seller_id == seller_id)
    return query


def _seller_order_items_query(db: Session, seller_id: Optional[int], since: Optional[datetime] = None):
    query = (
        db.query(models.OrderItem)
        .join(models.Product, models.OrderItem.product_id == models.Product.id)
        .join(models.Order, models.OrderItem.order_id == models.Order.id)
    )
    if seller_id is not None:
        query = query.filter(models.Product.seller_id == seller_id)
    if since is not None:
        query = query.filter(models.Order.created_at >= since)
    return query


def get_seller_dashboard(db: Session, seller_id: Optional[int]) -> schemas.SellerDashboardResponse:
    products = _seller_product_query(db, seller_id).all()
    active_products = [p for p in products if p.is_active]
    low_stock = [p for p in active_products if 0 < p.stock <= _low_stock_threshold()]
    out_of_stock = [p for p in active_products if p.stock == 0]

    item_query = _seller_order_items_query(db, seller_id)
    all_items = (
        item_query.options(joinedload(models.OrderItem.order), joinedload(models.OrderItem.product)).all()
    )
    pending_items = [i for i in all_items if i.status in PENDING_ORDER_ITEM_STATUSES]
    completed_items = [i for i in all_items if i.status in COMPLETED_ORDER_ITEM_STATUSES]

    delivered_items = [i for i in all_items if i.status == "Delivered"]
    total_sales = sum(i.price * i.quantity for i in delivered_items)

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_sales = sum(
        i.price * i.quantity
        for i in delivered_items
        if i.order.created_at and i.order.created_at >= month_start
    )

    product_sales = defaultdict(lambda: {"units": 0, "revenue": 0.0, "name": ""})
    for item in delivered_items:
        product_sales[item.product_id]["units"] += item.quantity
        product_sales[item.product_id]["revenue"] += item.price * item.quantity
        product_sales[item.product_id]["name"] = item.product.name

    best_selling = sorted(
        [
            schemas.BestSellingProduct(
                product_id=pid,
                product_name=data["name"],
                units_sold=data["units"],
                revenue=round(data["revenue"], 2),
            )
            for pid, data in product_sales.items()
        ],
        key=lambda x: x.units_sold,
        reverse=True,
    )[:5]

    recent_order_map = defaultdict(lambda: {"items": [], "order": None})
    for item in sorted(all_items, key=lambda x: x.order.created_at or now, reverse=True)[:50]:
        recent_order_map[item.order_id]["items"].append(item)
        recent_order_map[item.order_id]["order"] = item.order

    recent_orders = []
    for order_id, data in list(recent_order_map.items())[:5]:
        order = data["order"]
        items = data["items"]
        recent_orders.append(
            schemas.RecentSellerOrder(
                order_id=order_id,
                created_at=order.created_at,
                customer_name=order.user.name if order.user else "Unknown",
                item_count=len(items),
                revenue=round(sum(i.price * i.quantity for i in items), 2),
            )
        )

    return schemas.SellerDashboardResponse(
        total_products=len(products),
        active_products=len(active_products),
        low_stock_products=len(low_stock),
        out_of_stock_products=len(out_of_stock),
        pending_orders=len({i.order_id for i in pending_items}),
        completed_orders=len({i.order_id for i in completed_items}),
        total_sales=round(total_sales, 2),
        monthly_sales=round(monthly_sales, 2),
        recent_orders=recent_orders,
        best_selling_products=best_selling,
    )


def get_sales_summary(db: Session, seller_id: Optional[int], days: int) -> schemas.SalesSummaryResponse:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    items = (
        _seller_order_items_query(db, seller_id, since=since)
        .options(joinedload(models.OrderItem.order), joinedload(models.OrderItem.product))
        .all()
    )
    delivered = [i for i in items if i.status == "Delivered"]
    revenue = sum(i.price * i.quantity for i in delivered)
    order_ids = {i.order_id for i in delivered}
    units_sold = sum(i.quantity for i in delivered)
    aov = round(revenue / len(order_ids), 2) if order_ids else 0.0

    product_totals = defaultdict(lambda: {"units": 0, "revenue": 0.0, "name": ""})
    for item in delivered:
        product_totals[item.product_id]["units"] += item.quantity
        product_totals[item.product_id]["revenue"] += item.price * item.quantity
        product_totals[item.product_id]["name"] = item.product.name

    top_products = sorted(
        [
            schemas.TopSellingProductSummary(
                product_id=pid,
                product_name=data["name"],
                units_sold=data["units"],
                revenue=round(data["revenue"], 2),
            )
            for pid, data in product_totals.items()
        ],
        key=lambda x: x.units_sold,
        reverse=True,
    )[:10]

    daily = defaultdict(lambda: {"revenue": 0.0, "orders": set()})
    monthly = defaultdict(lambda: {"revenue": 0.0, "orders": set()})
    for item in delivered:
        created = item.order.created_at
        if not created:
            continue
        day_key = created.date().isoformat()
        month_key = created.strftime("%Y-%m")
        daily[day_key]["revenue"] += item.price * item.quantity
        daily[day_key]["orders"].add(item.order_id)
        monthly[month_key]["revenue"] += item.price * item.quantity
        monthly[month_key]["orders"].add(item.order_id)

    daily_sales = [
        schemas.DailySalesPoint(date=day, revenue=round(vals["revenue"], 2), orders=len(vals["orders"]))
        for day, vals in sorted(daily.items())
    ]
    monthly_sales = [
        schemas.MonthlySalesPoint(month=month, revenue=round(vals["revenue"], 2), orders=len(vals["orders"]))
        for month, vals in sorted(monthly.items())
    ]

    return schemas.SalesSummaryResponse(
        days=days,
        revenue=round(revenue, 2),
        orders=len(order_ids),
        average_order_value=aov,
        units_sold=units_sold,
        top_selling_products=top_products,
        daily_sales=daily_sales,
        monthly_sales=monthly_sales,
    )
