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

interface StreakAtRiskEmailProps {
  userName: string;
  currentStreak: number;
  incompleteProtocols: { name: string; category: string }[];
  appUrl: string;
}

export function StreakAtRiskEmail({
  userName = "there",
  currentStreak = 0,
  incompleteProtocols = [],
  appUrl = "http://localhost:3000",
}: StreakAtRiskEmailProps) {
  const previewText = `Don't lose your ${currentStreak}-day streak!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={emoji}>🔥</Text>

          <Heading style={h1}>Don't lose your streak!</Heading>

          <Text style={text}>Hey {userName},</Text>

          <Text style={highlightText}>
            Your <strong>{currentStreak}-day streak</strong> is at risk!
          </Text>

          <Text style={text}>
            You still have {incompleteProtocols.length} protocol{incompleteProtocols.length !== 1 ? "s" : ""} to complete today.
            Complete them before midnight to keep your streak alive.
          </Text>

          {incompleteProtocols.length > 0 && (
            <Section style={listContainer}>
              <Text style={listHeader}>Still to do:</Text>
              {incompleteProtocols.map((protocol, i) => (
                <Text key={i} style={listItem}>
                  {getCategoryIcon(protocol.category)} {protocol.name}
                </Text>
              ))}
            </Section>
          )}

          <Section style={buttonContainer}>
            <Button style={button} href={`${appUrl}/today`}>
              Complete Now
            </Button>
          </Section>

          <Text style={motivationText}>
            You've worked hard for this streak. Don't let it slip away!
          </Text>

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

const emoji = {
  fontSize: "48px",
  textAlign: "center" as const,
  margin: "0 0 10px",
};

const h1 = {
  color: "#dc2626",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
  padding: "0 48px",
  textAlign: "center" as const,
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 10px",
  padding: "0 48px",
};

const highlightText = {
  color: "#1f2937",
  fontSize: "18px",
  lineHeight: "28px",
  margin: "0 0 16px",
  padding: "16px 48px",
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  textAlign: "center" as const,
};

const motivationText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
  padding: "0 48px",
  fontStyle: "italic",
  textAlign: "center" as const,
};

const listContainer = {
  margin: "20px 0",
  padding: "0 48px",
};

const listHeader = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  margin: "0 0 8px",
};

const listItem = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0 0 8px",
  padding: "8px 12px",
  backgroundColor: "#fef2f2",
  borderRadius: "6px",
  borderLeft: "3px solid #ef4444",
};

const buttonContainer = {
  padding: "27px 48px 27px 48px",
};

const button = {
  backgroundColor: "#dc2626",
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

export default StreakAtRiskEmail;
