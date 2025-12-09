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

interface DailyReminderEmailProps {
  userName: string;
  protocols: { name: string; category: string }[];
  currentStreak: number;
  appUrl: string;
}

export function DailyReminderEmail({
  userName = "there",
  protocols = [],
  currentStreak = 0,
  appUrl = "http://localhost:3000",
}: DailyReminderEmailProps) {
  const previewText = `Time for your ${protocols.length} protocols today!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Time for your protocols!</Heading>

          <Text style={text}>Hey {userName},</Text>

          <Text style={text}>
            You have <strong>{protocols.length} protocols</strong> to complete today.
            {currentStreak > 0 && (
              <> Your current streak is <strong>{currentStreak} days</strong> - keep it going!</>
            )}
          </Text>

          {protocols.length > 0 && (
            <Section style={listContainer}>
              {protocols.map((protocol, i) => (
                <Text key={i} style={listItem}>
                  {getCategoryIcon(protocol.category)} {protocol.name}
                </Text>
              ))}
            </Section>
          )}

          <Section style={buttonContainer}>
            <Button style={button} href={`${appUrl}/today`}>
              Mark Complete
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

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    sleep: "🌙",
    focus: "🎯",
    energy: "⚡",
    fitness: "💪",
  };
  return icons[category] || "📋";
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

const listContainer = {
  margin: "20px 0",
  padding: "0 48px",
};

const listItem = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0 0 8px",
  padding: "8px 12px",
  backgroundColor: "#f9fafb",
  borderRadius: "6px",
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

export default DailyReminderEmail;
