export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  scopes: Array<"web" | "device" | "files" | "calendar" | "coding" | "research">;
  trusted: boolean;
  requiredTools: string[];
}

export class SkillRegistry {
  private readonly skills = new Map<string, SkillDefinition>();

  register(skill: SkillDefinition): void {
    if (!skill.trusted) throw new Error(`Untrusted skill cannot be activated: ${skill.id}`);
    this.skills.set(skill.id, skill);
  }

  get(id: string): SkillDefinition | undefined {
    return this.skills.get(id);
  }

  list(): SkillDefinition[] {
    return [...this.skills.values()];
  }
}
