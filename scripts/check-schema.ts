import "dotenv/config";
import {
  sequelize,
  Customer,
  Order,
  Refund,
  SupportRequest,
  AgentRun,
  ToolCall,
  Escalation,
} from "../src/models";

const models = [
  Customer,
  Order,
  Refund,
  SupportRequest,
  AgentRun,
  ToolCall,
  Escalation,
];

async function main() {
  await sequelize.authenticate();
  await sequelize.sync();

  for (const model of models) {
    const table = model.getTableName();
    const attrs = Object.keys(model.rawAttributes);
    console.log(`\n== ${table} ==`);
    console.log("  fields:", attrs.join(", "));
  }

  const assoc = SupportRequest.associations.escalation;
  console.log("\nASSOCIATION escalation ->", assoc?.target?.getTableName());

  await SupportRequest.findAll({
    limit: 1,
    include: [
      { model: Customer, as: "customer" },
      { model: Escalation, as: "escalation" },
    ],
  });

  console.log("\nSCHEMA_OK=true");
  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
