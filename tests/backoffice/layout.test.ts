import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import ts from "typescript";
import baseline from "../fixtures/layout-contract.json";

function markup(file: string) {
  const tree = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const rows: { tag: string; className: string }[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const style = node.attributes.properties.find((attribute) =>
        ts.isJsxAttribute(attribute) && attribute.name.getText(tree) === "className");
      rows.push({
        tag: node.tagName.getText(tree),
        className: style && ts.isJsxAttribute(style) ? style.initializer?.getText(tree).replace(/\s+/g, " ") || "" : "",
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return rows;
}
test("integration preserves every existing component's markup and CSS classes", () => {
  for (const [file, signature] of Object.entries(baseline.components))
    assert.deepEqual(markup(file), signature, "Visual markup changed in " + file);
});
test("all original CSS, spacing, colors, typography and reference styles remain byte-identical", () => {
  for (const [file, expected] of Object.entries(baseline.styles))
    assert.equal(createHash("sha256").update(readFileSync(file)).digest("hex"), expected, file);
});
