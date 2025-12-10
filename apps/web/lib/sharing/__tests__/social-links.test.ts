import {
  getTwitterShareUrl,
  getFacebookShareUrl,
  getLinkedInShareUrl,
  getWhatsAppShareUrl,
  getEmailShareUrl,
  type ShareContent,
} from "../social-links";

const mockContent: ShareContent = {
  title: "Cold Plunge Protocol",
  description: "Boost energy and recovery with cold water immersion",
  url: "https://myprotocolstack.com/protocols/cold-plunge?utm_source=twitter&utm_medium=social",
};

describe("getTwitterShareUrl", () => {
  it("should generate valid Twitter intent URL", () => {
    const result = getTwitterShareUrl(mockContent);

    expect(result).toContain("https://twitter.com/intent/tweet");
    expect(result).toContain("text=");
    expect(result).toContain("url=");
  });

  it("should include title and description in text param", () => {
    const result = getTwitterShareUrl(mockContent);
    // URLSearchParams uses + for spaces, which is valid for form encoding
    expect(result).toContain("Cold");
    expect(result).toContain("Plunge");
    expect(result).toContain("Protocol");
    expect(result).toContain("Boost");
    expect(result).toContain("energy");
  });
});

describe("getFacebookShareUrl", () => {
  it("should generate valid Facebook sharer URL", () => {
    const result = getFacebookShareUrl(mockContent);

    expect(result).toContain("https://www.facebook.com/sharer/sharer.php");
    expect(result).toContain("u=");
  });

  it("should include share URL", () => {
    const result = getFacebookShareUrl(mockContent);
    const url = new URL(result);

    expect(url.searchParams.get("u")).toBe(mockContent.url);
  });
});

describe("getLinkedInShareUrl", () => {
  it("should generate valid LinkedIn share URL", () => {
    const result = getLinkedInShareUrl(mockContent);

    expect(result).toContain("https://www.linkedin.com/sharing/share-offsite/");
    expect(result).toContain("url=");
  });
});

describe("getWhatsAppShareUrl", () => {
  it("should generate valid WhatsApp share URL", () => {
    const result = getWhatsAppShareUrl(mockContent);

    expect(result).toContain("https://wa.me/");
    expect(result).toContain("text=");
  });

  it("should combine title, description, and URL in message", () => {
    const result = getWhatsAppShareUrl(mockContent);

    expect(result).toContain(encodeURIComponent(mockContent.title));
    expect(result).toContain(encodeURIComponent(mockContent.url));
  });
});

describe("getEmailShareUrl", () => {
  it("should generate valid mailto URL", () => {
    const result = getEmailShareUrl(mockContent);

    expect(result).toContain("mailto:");
    expect(result).toContain("subject=");
    expect(result).toContain("body=");
  });

  it("should use title as subject", () => {
    const result = getEmailShareUrl(mockContent);

    expect(result).toContain(`subject=${encodeURIComponent(mockContent.title)}`);
  });

  it("should include description and URL in body", () => {
    const result = getEmailShareUrl(mockContent);

    expect(result).toContain(encodeURIComponent(mockContent.description));
    expect(result).toContain(encodeURIComponent(mockContent.url));
  });
});
