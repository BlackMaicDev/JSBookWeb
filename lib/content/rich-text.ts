import sanitizeHtml from "sanitize-html";

export function sanitizeRichText(value: unknown): string {
  if (typeof value !== "string") return "";
  return sanitizeHtml(value, {
    allowedTags: ["p", "br", "h1", "h2", "h3", "strong", "b", "em", "i", "u", "s", "mark", "span", "ul", "ol", "li", "blockquote", "hr", "pre", "code", "a", "img"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      p: ["style"], h1: ["style"], h2: ["style"], h3: ["style"], span: ["style"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(left|center|right|justify)$/],
        color: [/^#[0-9a-fA-F]{3,8}$/],
        "font-size": [/^(14|16|18|22|28)px$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tag, attrs) => ({ tagName: "a", attribs: { ...attrs, rel: "noopener noreferrer", target: "_blank" } }),
      img: (_tag, attrs) => {
        const safe: Record<string, string> = {};
        for (const key of ["src", "alt", "title"] as const) {
          if (attrs[key]) safe[key] = attrs[key];
        }
        for (const key of ["width", "height"] as const) {
          const value = attrs[key];
          if (/^\d{2,4}$/.test(value || "") && Number(value) >= 80 && Number(value) <= 1600) safe[key] = value;
        }
        return { tagName: "img", attribs: safe };
      },
    },
  });
}
