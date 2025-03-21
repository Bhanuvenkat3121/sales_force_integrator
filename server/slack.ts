import { WebClient } from "@slack/web-api";
import type { Ticket } from "@shared/schema";

if (!process.env.SLACK_BOT_TOKEN) {
  throw new Error("SLACK_BOT_TOKEN environment variable must be set");
}

if (!process.env.SLACK_CHANNEL_ID) {
  throw new Error("SLACK_CHANNEL_ID environment variable must be set");
}

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function notifyNewTicket(ticket: Ticket) {
  try {
    await slack.chat.postMessage({
      channel: process.env.SLACK_CHANNEL_ID!,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*New Support Ticket*"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Subject:*\n${ticket.subject}`
            },
            {
              type: "mrkdwn",
              text: `*Priority:*\n${ticket.priority}`
            },
            {
              type: "mrkdwn",
              text: `*Category:*\n${ticket.category}`
            },
            {
              type: "mrkdwn",
              text: `*Assigned Team:*\n${ticket.assignedTeam}`
            }
          ]
        }
      ]
    });
  } catch (error) {
    console.error("Slack notification error:", error);
    throw new Error("Failed to send Slack notification");
  }
}
