import {V1Secret} from "@kubernetes/client-node";
import {dataValuesToBase64} from "./encoding";

interface SecretDefinition {
  name: string;
  namespace: string;
  data?: Record<string, string>;
  stringData?: Record<string, string>;
}

export default function createSecret(definition: SecretDefinition): V1Secret {
  return {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: definition.name,
      namespace: definition.namespace
    },
    data: definition.data || dataValuesToBase64(definition.stringData || {}),
    // stringData: definition.stringData || dataValuesFromBase64(definition.data || {})
  };
}
