import * as Sentry from "@sentry/node";

Sentry.init({
    dsn: "https://c4173eac7ed79023b202bda083e4fcee@o4509622107701248.ingest.us.sentry.io/4509622110453760",

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
});