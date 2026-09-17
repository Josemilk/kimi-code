export type Risk = "low" | "medium" | "high" | "critical";
export type Decision = "allow" | "confirm" | "deny";

export interface CapabilityRequest {
  capability: string;
  risk: Risk;
  reason: string;
  affectsExternalState: boolean;
  handlesSecret: boolean;
}

export interface PermissionPolicy {
  decide(request: CapabilityRequest): Decision;
}

/** Conservative defaults for a personal autonomous agent. */
export class DefaultPermissionPolicy implements PermissionPolicy {
  decide(request: CapabilityRequest): Decision {
    if (request.risk === "critical" || request.handlesSecret) return "deny";
    if (request.risk === "high" || request.affectsExternalState) return "confirm";
    return "allow";
  }
}
