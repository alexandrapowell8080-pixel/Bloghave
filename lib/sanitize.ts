import sanitizeHtml from "sanitize-html";

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "em", "u", "s", "b", "i", "h2", "h3", "h4",
    "ul", "ol", "li", "blockquote", "pre", "code", "a", "img", "table",
    "thead", "tbody", "tr", "th", "td", "hr", "span", "mark", "sub", "sup",
    "figure", "figcaption", "div", "label", "input",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "name"],
    img: ["src", "alt", "title", "width", "height", "class"],
    td: ["colspan", "rowspan", "style"],
    th: ["colspan", "rowspan", "style"],
    "*": ["style", "id", "class", "data-type", "data-checked", "colspan", "rowspan"],
    input: ["type", "checked", "disabled"],
  },
  allowedStyles: {
    "*": {
      "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
      color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/],
      "background-color": [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/, /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/],
      width: [/^\d+(?:px|%)$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto", "data"],
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: "noopener noreferrer",
        target: attribs.target || "_blank",
      },
    }),
  },
};

export function sanitizeContent(html: string) {
  return sanitizeHtml(html || "", options);
}
