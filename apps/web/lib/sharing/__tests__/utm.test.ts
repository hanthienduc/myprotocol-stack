import { buildShareUrl, getProtocolShareUrl, getStackShareUrl } from "../utm";

// Mock env variable
const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_APP_URL: "https://myprotocolstack.com",
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe("buildShareUrl", () => {
  it("should build URL with UTM parameters", () => {
    const result = buildShareUrl("https://myprotocolstack.com/protocols/123", {
      source: "twitter",
      medium: "social",
    });

    expect(result).toContain("utm_source=twitter");
    expect(result).toContain("utm_medium=social");
  });

  it("should include optional campaign and content", () => {
    const result = buildShareUrl("https://myprotocolstack.com/protocols/123", {
      source: "facebook",
      medium: "social",
      campaign: "protocol_share",
      content: "cold-plunge",
    });

    expect(result).toContain("utm_campaign=protocol_share");
    expect(result).toContain("utm_content=cold-plunge");
  });

  it("should include referral code when provided", () => {
    const result = buildShareUrl(
      "https://myprotocolstack.com/protocols/123",
      { source: "twitter", medium: "social" },
      "ABC123"
    );

    expect(result).toContain("ref=ABC123");
  });

  it("should not include ref param when referralCode is undefined", () => {
    const result = buildShareUrl(
      "https://myprotocolstack.com/protocols/123",
      { source: "twitter", medium: "social" }
    );

    expect(result).not.toContain("ref=");
  });

  it("should handle relative URLs", () => {
    const result = buildShareUrl("/protocols/123", {
      source: "copy",
      medium: "social",
    });

    expect(result).toContain("myprotocolstack.com/protocols/123");
    expect(result).toContain("utm_source=copy");
  });
});

describe("getProtocolShareUrl", () => {
  it("should generate protocol share URL with correct UTM params", () => {
    const result = getProtocolShareUrl("abc-123", "twitter");

    expect(result).toContain("/protocols/abc-123");
    expect(result).toContain("utm_source=twitter");
    expect(result).toContain("utm_medium=social");
    expect(result).toContain("utm_campaign=protocol_share");
    expect(result).toContain("utm_content=abc-123");
  });

  it("should include referral code when provided", () => {
    const result = getProtocolShareUrl("abc-123", "twitter", "REF456");

    expect(result).toContain("ref=REF456");
  });
});

describe("getStackShareUrl", () => {
  it("should generate stack share URL with correct UTM params", () => {
    const result = getStackShareUrl("stack-789", "linkedin");

    expect(result).toContain("/stacks/stack-789");
    expect(result).toContain("utm_source=linkedin");
    expect(result).toContain("utm_medium=social");
    expect(result).toContain("utm_campaign=stack_share");
    expect(result).toContain("utm_content=stack-789");
  });

  it("should include referral code when provided", () => {
    const result = getStackShareUrl("stack-789", "linkedin", "REF789");

    expect(result).toContain("ref=REF789");
  });
});
