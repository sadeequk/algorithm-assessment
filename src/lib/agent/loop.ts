import OpenAI from "openai";
import {
  AGENT_DEFAULT_MODEL,
  AGENT_MAX_STEPS,
  AGENT_RUN_STATUS,
  AGENT_SYSTEM_PROMPT,
  AGENT_TEMPERATURE,
  SupportRequestStatus,
} from "@/constants";
import { executeTool, toolDefinitions } from "@/lib/agent/tools";
import { runMockAgent } from "@/lib/agent/mock";
import { AgentRun, SupportRequest, ToolCall } from "@/models";

const TERMINAL_REQUEST_STATUSES = new Set<string>([
  SupportRequestStatus.AUTO_RESOLVED,
  SupportRequestStatus.ESCALATED,
  SupportRequestStatus.FAILED,
]);

export async function runAgentLoop(supportRequestId: string) {
  const request = await SupportRequest.findByPk(supportRequestId);
  if (!request) {
    throw new Error(`Support request ${supportRequestId} not found`);
  }

  await request.update({ status: SupportRequestStatus.PROCESSING });

  const run = await AgentRun.create({
    support_request_id: supportRequestId,
    status: AGENT_RUN_STATUS.RUNNING,
  });

  try {
    if (process.env.USE_MOCK_AGENT === "true" || !process.env.OPENAI_API_KEY) {
      const outcome = await runMockAgent({
        supportRequestId,
        agentRunId: run.id,
        customerMessage: request.customer_message,
        customerId: request.customer_id,
      });
      await run.update({
        status: AGENT_RUN_STATUS.COMPLETED,
        final_outcome: outcome.finalOutcome,
        reasoning_summary: outcome.reasoningSummary,
        completed_at: new Date(),
      });
      return { agentRunId: run.id, ...outcome };
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || AGENT_DEFAULT_MODEL;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: AGENT_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Customer support request:\n"""${request.customer_message}"""\n\nProcess this request using tools.`,
      },
    ];

    let sequence = 0;
    let finalOutcome = "completed";
    let reasoningSummary = "";

    for (let step = 0; step < AGENT_MAX_STEPS; step++) {
      const completion = await client.chat.completions.create({
        model,
        messages,
        tools: toolDefinitions,
        tool_choice: "auto",
        temperature: AGENT_TEMPERATURE,
      });

      const choice = completion.choices[0];
      const msg = choice.message;
      messages.push(msg);

      if (msg.content) {
        reasoningSummary = msg.content;
      }

      const toolCalls = msg.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        finalOutcome =
          reasoningSummary || "Agent finished without further tool calls";
        break;
      }

      for (const call of toolCalls) {
        if (call.type !== "function") continue;
        const args = JSON.parse(call.function.arguments || "{}");
        const result = await executeTool(call.function.name, args, {
          supportRequestId,
          customerId: request.customer_id,
        });

        sequence += 1;
        await ToolCall.create({
          agent_run_id: run.id,
          sequence,
          tool_name: call.function.name,
          tool_arguments: args,
          result: result as object,
        });

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });

        if (
          call.function.name === "escalate_for_approval" ||
          call.function.name === "resolve_without_action" ||
          (call.function.name === "cancel_order" &&
            typeof result === "object" &&
            result !== null &&
            "ok" in result &&
            (result as { ok: boolean }).ok)
        ) {
          finalOutcome = `${call.function.name}: ${JSON.stringify(result)}`;
        }
      }

      const refreshed = await SupportRequest.findByPk(supportRequestId);
      if (refreshed && TERMINAL_REQUEST_STATUSES.has(refreshed.status)) {
        break;
      }
    }

    const refreshed = await SupportRequest.findByPk(supportRequestId);
    const humanSummary =
      reasoningSummary.trim() ||
      refreshed?.outcome_summary ||
      "Agent finished processing the request.";

    await run.update({
      status: AGENT_RUN_STATUS.COMPLETED,
      final_outcome: finalOutcome,
      reasoning_summary: humanSummary,
      completed_at: new Date(),
    });

    return {
      agentRunId: run.id,
      finalOutcome,
      reasoningSummary: humanSummary,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown agent error";
    await run.update({
      status: AGENT_RUN_STATUS.FAILED,
      final_outcome: message,
      completed_at: new Date(),
    });
    await SupportRequest.update(
      {
        status: SupportRequestStatus.FAILED,
        outcome_summary: message,
      },
      { where: { id: supportRequestId } },
    );
    throw err;
  }
}
