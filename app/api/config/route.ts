import { NextResponse } from "next/server";

export async function GET() {
  // All external destinations are configured via env
  const urls = {
    meetingUpload: process.env.AIRTABLE_URL_MEETING_UPLOAD || "",
    articleUpload: process.env.AIRTABLE_URL_ARTICLE_UPLOAD || "",
    aiExchangeUpload: process.env.AIRTABLE_URL_AI_EXCHANGE_UPLOAD || "",
    adminBase: process.env.AIRTABLE_BASE_ADMIN_URL || "",
    documentsUpload: process.env.AIRTABLE_URL_DOCUMENTS_UPLOAD || "",
    elevenLabs:
      process.env.ELEVEN_LABS_CONVO || process.env["11_LABS_CONVO"] || "",
    news: process.env.NEWS_SUBMISSION_URL || "", // optional
  };

  const features = {
    showBigNewsBanner: (process.env.SHOW_BIG_NEWS_BANNER ?? "true") !== "false",
    bigNewsBadge: process.env.BIG_NEWS_BADGE || "Breaking",
  };

  return NextResponse.json({ urls, features });
}
