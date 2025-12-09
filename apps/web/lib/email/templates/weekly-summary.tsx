import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WeeklySummaryEmailProps {
  userName: string;
  adherenceRate: number;
  totalCompleted: number;
  totalTracked: number;
  bestDay: string;
  currentStreak: number;
  appUrl: string;
}

export function WeeklySummaryEmail({
  userName = "there",
  adherenceRate = 0,
  totalCompleted = 0,
  totalTracked = 0,
  bestDay = "Monday",
  currentStreak = 0,
  appUrl = "http://localhost:3000",
}: WeeklySummaryEmailProps) {
  const previewText = `Your weekly summary: ${adherenceRate}% adherence rate`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Weekly Protocol Summary</Heading>

          <Text style={text}>Hey {userName},</Text>

          <Text style={text}>
            Here's how you did this week with your health protocols:
          </Text>

          {/* Stats Grid */}
          <Section style={statsContainer}>
            <table style={statsTable}>
              <tr>
                <td style={statBox}>
                  <Text style={statValue}>{adherenceRate}%</Text>
                  <Text style={statLabel}>Adherence</Text>
                </td>
                <td style={statBox}>
                  <Text style={statValue}>{totalCompleted}/{totalTracked}</Text>
                  <Text style={statLabel}>Completed</Text>
                </td>
              </tr>
              <tr>
                <td style={statBox}>
                  <Text style={statValue}>{bestDay}</Text>
                  <Text style={statLabel}>Best Day</Text>
                </td>
                <td style={statBox}>
                  <Text style={statValue}>{currentStreak}</Text>
                  <Text style={statLabel}>Day Streak</Text>
                </td>
              </tr>
            </table>
          </Section>

          {adherenceRate >= 80 && (
            <Text style={successText}>
              Amazing work this week! You're building strong habits.
            </Text>
          )}

          {adherenceRate >= 50 && adherenceRate < 80 && (
            <Text style={text}>
              Good progress! Try to complete a few more protocols each day.
            </Text>
          )}

          {adherenceRate < 50 && (
            <Text style={text}>
              Every day is a new opportunity. Let's aim higher this week!
            </Text>
          )}

          <Section style={buttonContainer}>
            <Button style={button} href={`${appUrl}/analytics`}>
              View Full Analytics
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            <Link href={`${appUrl}/settings`} style={link}>
              Manage notification settings
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "5px",
};

const h1 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
  padding: "0 48px",
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 10px",
  padding: "0 48px",
};

const successText = {
  color: "#059669",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 10px",
  padding: "0 48px",
  fontWeight: "500",
};

const statsContainer = {
  padding: "20px 48px",
};

const statsTable = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const statBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px",
  textAlign: "center" as const,
  width: "50%",
  border: "4px solid #ffffff",
};

const statValue = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "32px",
  margin: "0",
};

const statLabel = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "4px 0 0",
  textTransform: "uppercase" as const,
};

const buttonContainer = {
  padding: "27px 48px 27px 48px",
};

const button = {
  backgroundColor: "#6366f1",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "0",
  padding: "0 48px",
};

const link = {
  color: "#6366f1",
  textDecoration: "underline",
};

export default WeeklySummaryEmail;
