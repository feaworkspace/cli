import {V1Role, V1RoleBinding, V1ServiceAccount} from "@kubernetes/client-node";

interface ServiceAccountDefinition {
  name: string;
  namespace: string;
  rules?: Array<{
    apiGroups: string[];
    resources: string[];
    verbs: string[];
  }>;
}

export default function createServiceAccount(def: ServiceAccountDefinition): [V1ServiceAccount, V1Role, V1RoleBinding] {
  const role = {
    apiVersion: "rbac.authorization.k8s.io/v1",
    kind: "Role",
    metadata: {
      name: def.name,
      namespace: def.namespace
    },
    rules: def.rules || []
  };

  const roleBinding = {
    apiVersion: "rbac.authorization.k8s.io/v1",
    kind: "RoleBinding",
    metadata: {
      name: def.name,
      namespace: def.namespace
    },
    subjects: [{
      kind: "ServiceAccount",
      name: def.name,
      namespace: def.namespace
    }],
    roleRef: {
      kind: "Role",
      name: def.name,
      apiGroup: "rbac.authorization.k8s.io"
    }
  };

  const serviceAccount = {
    apiVersion: "v1",
    kind: "ServiceAccount",
    metadata: {
      name: def.name,
      namespace: def.namespace
    }
  };

  return [serviceAccount, role, roleBinding];
}