import Parser from "tree-sitter";
import Cpp from "tree-sitter-cpp";
import Python from "tree-sitter-python";

export function parseCode(code: string, lang: "cpp" | "python") {
  const parser = new Parser();

  if (lang === "cpp") parser.setLanguage(Cpp);
  else parser.setLanguage(Python);

  return parser.parse(code);
}