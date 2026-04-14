window.HongzhiFrontend = window.HongzhiFrontend || {};

window.HongzhiFrontend.markdown = (() => {
  const utils = window.HongzhiFrontend.utils;

  function renderMarkdown(markdown) {
    const context = {
      headings: [],
      usedAnchors: new Set()
    };
    const lines = String(markdown || "")
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => line.replace(/\t/g, "  "));

    const result = parseBlocks(lines, context, 0, 0);
    return {
      html: result.html,
      headings: context.headings
    };
  }

  function parseBlocks(lines, context, startIndex = 0, baseIndent = 0) {
    const blocks = [];
    let index = startIndex;

    while (index < lines.length) {
      const rawLine = lines[index];
      if (!rawLine.trim()) {
        index += 1;
        continue;
      }

      const indent = countIndent(rawLine);
      if (indent < baseIndent) {
        break;
      }

      const line = rawLine.slice(baseIndent);

      if (isFenceStart(line)) {
        const codeBlock = readFence(lines, index, baseIndent);
        blocks.push(codeBlock.html);
        index = codeBlock.nextIndex;
        continue;
      }

      const headingMatch = matchHeading(line);
      if (headingMatch) {
        const level = Math.min(headingMatch[1].length, 4);
        const text = stripMarkdown(headingMatch[2].trim());
        const anchor = createAnchor(text, context.usedAnchors, context.headings.length + 1);
        context.headings.push({ level, text, anchor });
        blocks.push(`<h${level} id="${anchor}">${renderInlineMarkdown(headingMatch[2].trim())}</h${level}>`);
        index += 1;
        continue;
      }

      if (isHorizontalRule(line)) {
        blocks.push("<hr>");
        index += 1;
        continue;
      }

      if (isBlockquote(line)) {
        const quote = renderBlockquote(lines, context, index, baseIndent);
        blocks.push(quote.html);
        index = quote.nextIndex;
        continue;
      }

      if (matchListItem(line)) {
        const list = renderList(lines, context, index, baseIndent);
        blocks.push(list.html);
        index = list.nextIndex;
        continue;
      }

      const paragraph = renderParagraph(lines, index, baseIndent);
      blocks.push(paragraph.html);
      index = paragraph.nextIndex;
    }

    return {
      html: blocks.join(""),
      nextIndex: index
    };
  }

  function renderParagraph(lines, startIndex, baseIndent) {
    const parts = [];
    let index = startIndex;

    while (index < lines.length) {
      const rawLine = lines[index];
      if (!rawLine.trim()) {
        break;
      }

      const indent = countIndent(rawLine);
      if (indent < baseIndent) {
        break;
      }

      const line = rawLine.slice(baseIndent);
      if (index !== startIndex && startsNewBlock(line)) {
        break;
      }

      parts.push(line.trim());
      index += 1;
    }

    return {
      html: `<p>${renderInlineMarkdown(parts.join(" "))}</p>`,
      nextIndex: index
    };
  }

  function renderList(lines, context, startIndex, baseIndent) {
    const opening = matchListItem(lines[startIndex].slice(baseIndent));
    const listIndent = opening.indent;
    const listType = opening.type;
    const items = [];
    let index = startIndex;

    while (index < lines.length) {
      const rawLine = lines[index];
      if (!rawLine.trim()) {
        index += 1;
        continue;
      }

      if (countIndent(rawLine) < baseIndent) {
        break;
      }

      const match = matchListItem(rawLine.slice(baseIndent));
      if (!match || match.indent !== listIndent || match.type !== listType) {
        break;
      }

      const itemContentIndent = baseIndent + match.contentIndent;
      const itemLines = [`${" ".repeat(itemContentIndent)}${match.text}`];
      index += 1;

      while (index < lines.length) {
        const nextLine = lines[index];
        if (!nextLine.trim()) {
          itemLines.push("");
          index += 1;
          continue;
        }

        if (countIndent(nextLine) < baseIndent + listIndent) {
          break;
        }

        const nextMatch = matchListItem(nextLine.slice(baseIndent));
        if (nextMatch && nextMatch.indent === listIndent && nextMatch.type === listType) {
          break;
        }

        itemLines.push(nextLine);
        index += 1;
      }

      const fragment = parseBlocks(itemLines, context, 0, itemContentIndent).html || `<p>${renderInlineMarkdown(match.text)}</p>`;
      items.push(`<li>${fragment}</li>`);
    }

    return {
      html: `<${listType}>${items.join("")}</${listType}>`,
      nextIndex: index
    };
  }

  function renderBlockquote(lines, context, startIndex, baseIndent) {
    const quoteLines = [];
    let index = startIndex;

    while (index < lines.length) {
      const rawLine = lines[index];
      if (!rawLine.trim()) {
        quoteLines.push("");
        index += 1;
        continue;
      }

      if (countIndent(rawLine) < baseIndent) {
        break;
      }

      const line = rawLine.slice(baseIndent);
      const match = /^ {0,3}>\s?(.*)$/.exec(line);
      if (!match) {
        break;
      }

      quoteLines.push(match[1]);
      index += 1;
    }

    const rendered = parseBlocks(quoteLines, context, 0, 0).html || "<p></p>";
    return {
      html: `<blockquote>${rendered}</blockquote>`,
      nextIndex: index
    };
  }

  function readFence(lines, startIndex, baseIndent) {
    const opening = lines[startIndex].slice(baseIndent);
    const fenceMatch = /^ {0,3}```\s*([\w.-]*)\s*$/.exec(opening);
    const language = fenceMatch?.[1] || "";
    const codeLines = [];
    let index = startIndex + 1;

    while (index < lines.length) {
      const rawLine = lines[index];
      const relative = countIndent(rawLine) >= baseIndent ? rawLine.slice(baseIndent) : rawLine;
      if (/^ {0,3}```\s*$/.test(relative)) {
        index += 1;
        break;
      }

      codeLines.push(rawLine.slice(Math.min(baseIndent, rawLine.length)));
      index += 1;
    }

    return {
      html: renderCodeBlock(language, codeLines.join("\n")),
      nextIndex: index
    };
  }

  function renderCodeBlock(language, code) {
    const label = language
      ? `<div class="code-block-head"><span>${utils.escapeHtml(language)}</span></div>`
      : "";
    const languageClass = language ? ` class="language-${utils.escapeAttribute(language)}"` : "";
    return `<div class="code-block">${label}<pre><code${languageClass}>${utils.escapeHtml(code)}</code></pre></div>`;
  }

  function renderInlineMarkdown(text) {
    let safe = utils.escapeHtml(text || "");
    const tokens = [];

    safe = safe.replace(/`([^`]+)`/g, (_, code) => {
      const token = `@@TOKEN${tokens.length}@@`;
      tokens.push(`<code>${code}</code>`);
      return token;
    });

    safe = safe.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
      const token = `@@TOKEN${tokens.length}@@`;
      const href = /^(https?:\/\/|mailto:|\/)/i.test(url) ? url : "";
      tokens.push(href
        ? `<a href="${utils.escapeAttribute(href)}" target="_blank" rel="noreferrer">${label}</a>`
        : label);
      return token;
    });

    safe = safe
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_]+)__/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/_([^_]+)_/g, "<em>$1</em>");

    for (let index = 0; index < tokens.length; index += 1) {
      safe = safe.replace(`@@TOKEN${index}@@`, tokens[index]);
    }

    return safe;
  }

  function extractPlainText(markdown) {
    return String(markdown || "")
      .replace(/\r\n?/g, "\n")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^#+\s+/gm, " ")
      .replace(/^\s*[-*]\s+/gm, " ")
      .replace(/^\s*\d+\.\s+/gm, " ")
      .replace(/^\s*>\s?/gm, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function estimateReadingMinutes(markdown) {
    const text = extractPlainText(markdown);
    const cjkCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const latinWords = text.replace(/[\u4e00-\u9fff]/g, " ").split(/\s+/).filter(Boolean).length;
    const totalMinutes = (cjkCount / 450) + (latinWords / 220);
    return Math.max(1, Math.round(totalMinutes || 1));
  }

  function stripMarkdown(text) {
    return String(text || "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[>#]/g, "")
      .trim();
  }

  function createAnchor(text, usedAnchors, fallbackIndex) {
    const base = stripMarkdown(text)
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "") || `section-${fallbackIndex}`;

    let candidate = base;
    let suffix = 2;

    while (usedAnchors.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    usedAnchors.add(candidate);
    return candidate;
  }

  function startsNewBlock(line) {
    return Boolean(
      isFenceStart(line) ||
      matchHeading(line) ||
      isHorizontalRule(line) ||
      isBlockquote(line) ||
      matchListItem(line)
    );
  }

  function isFenceStart(line) {
    return /^ {0,3}```/.test(line);
  }

  function matchHeading(line) {
    return /^ {0,3}(#{1,6})\s+(.+)$/.exec(line);
  }

  function isHorizontalRule(line) {
    return /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line);
  }

  function isBlockquote(line) {
    return /^ {0,3}>\s?/.test(line);
  }

  function matchListItem(line) {
    const unordered = /^( *)([-*])\s+(.+)$/.exec(line);
    if (unordered) {
      return {
        indent: unordered[1].length,
        type: "ul",
        text: unordered[3],
        contentIndent: unordered[1].length + unordered[2].length + 1
      };
    }

    const ordered = /^( *)(\d+\.)\s+(.+)$/.exec(line);
    if (ordered) {
      return {
        indent: ordered[1].length,
        type: "ol",
        text: ordered[3],
        contentIndent: ordered[1].length + ordered[2].length + 1
      };
    }

    return null;
  }

  function countIndent(line) {
    let count = 0;
    while (count < line.length && line[count] === " ") {
      count += 1;
    }
    return count;
  }

  return {
    renderMarkdown,
    estimateReadingMinutes,
    extractPlainText
  };
})();
