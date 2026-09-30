import { chineseSearchAliases } from "../../client/content/zh-CN";
import { displayName, searchText } from "../../client/i18n";
import { SYSTEMS, type Atlas, type Concept, type SystemId } from "./anatomy";

export interface SearchEntry {
  concept: Concept;
  systems: SystemId[];
  side: "left" | "right" | "both" | null;
  aliases: string[];
  searchable: string;
  named: string;
}

// Build once per catalogue; result context comes from source parts, not guessed anatomy.
export function anatomySearchIndex(atlas: Atlas) {
  const parts = new Map(atlas.parts.map((part) => [part.id, part]));
  return new Map(
    atlas.concepts.map((concept) => {
      const elements = concept.elements.flatMap((id) => {
        const part = parts.get(id);
        return part ? [part] : [];
      });
      const systems = new Set(elements.map((part) => part.system));
      const left = /\bleft\b/i.test(concept.name),
        right = /\bright\b/i.test(concept.name);
      // A paired bone can be inferred from its two explicitly named sides.
      // Left/right substructures inside an organ do not make the organ bilateral.
      const paired =
        elements.length === 2 &&
        ["left", "right"].every((side) =>
          elements.some(
            (part) => part.name.toLowerCase() === `${side} ${concept.name.toLowerCase()}`,
          ),
        );
      const entry: SearchEntry = {
        concept,
        systems: SYSTEMS.filter((system) => systems.has(system.id)).map((system) => system.id),
        side: (left && right) || paired ? "both" : left ? "left" : right ? "right" : null,
        aliases: chineseSearchAliases(concept.name).split("\n").filter(Boolean),
        searchable: searchText(concept.name, concept.id),
        named:
          `${concept.name}\n${displayName(concept.name, "zh-CN")}\n${concept.id}`.toLowerCase(),
      };
      return [concept.id, entry] as const;
    }),
  );
}

export function matchedSearchAlias(entry: SearchEntry, query: string) {
  const term = query.toLowerCase().trim();
  if (!term || entry.named.includes(term)) return undefined;
  return entry.aliases
    .filter((alias) => alias.includes(term))
    .sort((a, b) => a.length - b.length)[0];
}
