const orderId = Number(process.argv[2] || 3001);
const baseUrl = process.argv[3] || "http://localhost:3000";

async function attempt(tag: string) {
  const res = await fetch(`${baseUrl}/api/refunds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId,
      amountCents: 19999,
      reason: `concurrency-${tag}`,
    }),
  });
  const body = await res.json();
  return { tag, status: res.status, body };
}

async function main() {
  console.log(`Concurrent refunds on order ${orderId} via ${baseUrl}`);
  const [a, b] = await Promise.all([attempt("A"), attempt("B")]);
  console.log(JSON.stringify(a, null, 2));
  console.log(JSON.stringify(b, null, 2));

  const list = await fetch(`${baseUrl}/api/refunds`).then((r) => r.json());
  const forOrder = (list.refunds || []).filter(
    (r: { orderId: number }) => r.orderId === orderId,
  );
  console.log(`Refund rows for order ${orderId}: ${forOrder.length}`);
  if (forOrder.length !== 1) {
    console.error("FAIL: expected exactly one refund row");
    process.exit(1);
  }
  const successes = [a, b].filter((x) => x.status === 201);
  const failures = [a, b].filter((x) => x.status !== 201);
  if (successes.length !== 1 || failures.length !== 1) {
    console.error("FAIL: expected one HTTP success and one failure");
    process.exit(1);
  }
  console.log("PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
