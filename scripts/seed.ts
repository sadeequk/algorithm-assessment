import "dotenv/config";
import { sequelize } from "../src/lib/db";
import { Customer, Order, OrderStatus } from "../src/models";

async function main() {
  await import("../src/models");
  await sequelize.sync({ force: true });

  const alice = await Customer.create({
    email: "alice@example.com",
    name: "Alice Chen",
  });
  const bob = await Customer.create({
    email: "bob@example.com",
    name: "Bob Rivera",
  });
  const cara = await Customer.create({
    email: "cara@example.com",
    name: "Cara Nguyen",
  });
  const diego = await Customer.create({
    email: "diego@example.com",
    name: "Diego Santos",
  });
  const emma = await Customer.create({
    email: "emma@example.com",
    name: "Emma Brooks",
  });
  const farah = await Customer.create({
    email: "farah@example.com",
    name: "Farah Malik",
  });
  const george = await Customer.create({
    email: "george@example.com",
    name: "George Okonkwo",
  });

  await Order.bulkCreate([
    {
      id: 1043,
      customer_id: alice.id,
      status: OrderStatus.DELIVERED,
      total_cents: 12999,
      items_json: [{ sku: "MUG-01", name: "Ceramic Mug", qty: 1, cents: 12999 }],
      shipped_at: new Date("2026-11-10T10:00:00Z"),
    },
    {
      id: 1044,
      customer_id: alice.id,
      status: OrderStatus.PROCESSING,
      total_cents: 4599,
      items_json: [{ sku: "SOCK-02", name: "Wool Socks", qty: 2, cents: 4599 }],
      shipped_at: null,
    },
    {
      id: 1045,
      customer_id: alice.id,
      status: OrderStatus.PENDING,
      total_cents: 7999,
      items_json: [{ sku: "TOTE-01", name: "Canvas Tote", qty: 1, cents: 7999 }],
      shipped_at: null,
    },
    {
      id: 1046,
      customer_id: alice.id,
      status: OrderStatus.SHIPPED,
      total_cents: 3299,
      items_json: [{ sku: "NOTE-01", name: "Notebook Set", qty: 1, cents: 3299 }],
      shipped_at: new Date("2026-11-24T09:00:00Z"),
    },
    {
      id: 2001,
      customer_id: bob.id,
      status: OrderStatus.SHIPPED,
      total_cents: 8999,
      items_json: [{ sku: "LAMP-03", name: "Desk Lamp", qty: 1, cents: 8999 }],
      shipped_at: new Date("2026-11-20T14:00:00Z"),
    },
    {
      id: 2002,
      customer_id: bob.id,
      status: OrderStatus.PENDING,
      total_cents: 2499,
      items_json: [{ sku: "CABLE-01", name: "USB-C Cable", qty: 1, cents: 2499 }],
      shipped_at: null,
    },
    {
      id: 2003,
      customer_id: bob.id,
      status: OrderStatus.DELIVERED,
      total_cents: 5499,
      items_json: [
        { sku: "MOUSE-01", name: "Wireless Mouse", qty: 1, cents: 3499 },
        { sku: "PAD-01", name: "Mouse Pad", qty: 1, cents: 2000 },
      ],
      shipped_at: new Date("2026-10-28T12:00:00Z"),
    },
    {
      id: 2004,
      customer_id: bob.id,
      status: OrderStatus.PROCESSING,
      total_cents: 11999,
      items_json: [{ sku: "CAM-01", name: "Webcam HD", qty: 1, cents: 11999 }],
      shipped_at: null,
    },
    {
      id: 3001,
      customer_id: cara.id,
      status: OrderStatus.DELIVERED,
      total_cents: 19999,
      items_json: [{ sku: "HEAD-01", name: "Headphones", qty: 1, cents: 19999 }],
      shipped_at: new Date("2026-11-01T09:00:00Z"),
    },
    {
      id: 3002,
      customer_id: cara.id,
      status: OrderStatus.CANCELLED,
      total_cents: 1500,
      items_json: [{ sku: "STICKER", name: "Sticker Pack", qty: 1, cents: 1500 }],
      shipped_at: null,
    },
    {
      id: 3003,
      customer_id: cara.id,
      status: OrderStatus.SHIPPED,
      total_cents: 6499,
      items_json: [{ sku: "BOTTLE-01", name: "Water Bottle", qty: 1, cents: 6499 }],
      shipped_at: new Date("2026-11-22T08:00:00Z"),
    },
    {
      id: 3004,
      customer_id: cara.id,
      status: OrderStatus.DELIVERED,
      total_cents: 8799,
      items_json: [{ sku: "BAG-01", name: "Laptop Sleeve", qty: 1, cents: 8799 }],
      shipped_at: new Date("2026-10-12T15:00:00Z"),
    },
    {
      id: 4001,
      customer_id: diego.id,
      status: OrderStatus.PROCESSING,
      total_cents: 15999,
      items_json: [{ sku: "KB-01", name: "Mechanical Keyboard", qty: 1, cents: 15999 }],
      shipped_at: null,
    },
    {
      id: 4002,
      customer_id: diego.id,
      status: OrderStatus.DELIVERED,
      total_cents: 2999,
      items_json: [{ sku: "CASE-01", name: "Phone Case", qty: 1, cents: 2999 }],
      shipped_at: new Date("2026-09-15T16:00:00Z"),
    },
    {
      id: 4003,
      customer_id: diego.id,
      status: OrderStatus.PENDING,
      total_cents: 22999,
      items_json: [{ sku: "CHAIR-01", name: "Desk Chair", qty: 1, cents: 22999 }],
      shipped_at: null,
    },
    {
      id: 5001,
      customer_id: emma.id,
      status: OrderStatus.PENDING,
      total_cents: 9999,
      items_json: [{ sku: "WATCH-01", name: "Fitness Band", qty: 1, cents: 9999 }],
      shipped_at: null,
    },
    {
      id: 5002,
      customer_id: emma.id,
      status: OrderStatus.DELIVERED,
      total_cents: 4499,
      items_json: [{ sku: "CHARGER-01", name: "Fast Charger", qty: 1, cents: 4499 }],
      shipped_at: new Date("2026-11-05T11:30:00Z"),
    },
    {
      id: 5003,
      customer_id: emma.id,
      status: OrderStatus.SHIPPED,
      total_cents: 7499,
      items_json: [{ sku: "SPEAKER-01", name: "Bluetooth Speaker", qty: 1, cents: 7499 }],
      shipped_at: new Date("2026-11-25T07:00:00Z"),
    },
    {
      id: 6001,
      customer_id: farah.id,
      status: OrderStatus.DELIVERED,
      total_cents: 34999,
      items_json: [{ sku: "TABLET-01", name: "Tablet 10in", qty: 1, cents: 34999 }],
      shipped_at: new Date("2026-10-02T10:00:00Z"),
    },
    {
      id: 6002,
      customer_id: farah.id,
      status: OrderStatus.PROCESSING,
      total_cents: 5999,
      items_json: [{ sku: "STAND-01", name: "Tablet Stand", qty: 1, cents: 5999 }],
      shipped_at: null,
    },
    {
      id: 7001,
      customer_id: george.id,
      status: OrderStatus.PENDING,
      total_cents: 18999,
      items_json: [{ sku: "MONITOR-01", name: "24in Monitor", qty: 1, cents: 18999 }],
      shipped_at: null,
    },
    {
      id: 7002,
      customer_id: george.id,
      status: OrderStatus.DELIVERED,
      total_cents: 1299,
      items_json: [{ sku: "HDMI-01", name: "HDMI Cable", qty: 2, cents: 1299 }],
      shipped_at: new Date("2026-11-18T13:00:00Z"),
    },
  ]);

  console.log("Seeded 7 customers, 22 orders");
  console.log("Customers: alice, bob, cara, diego, emma, farah, george @example.com");
  console.log("Key test orders:");
  console.log("  1043 DELIVERED  refund");
  console.log("  1044 PROCESSING auto-cancel");
  console.log("  2001 SHIPPED    cancel -> escalate");
  console.log("  3001 DELIVERED  damaged/replace");
  console.log("  9999            fake id (no action)");
}

main()
  .then(() => sequelize.close())
  .catch(async (e) => {
    console.error(e);
    await sequelize.close();
    process.exit(1);
  });
