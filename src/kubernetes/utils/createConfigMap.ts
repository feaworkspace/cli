import {V1ConfigMap} from "@kubernetes/client-node";
import { valuesToString } from "./encoding";

interface ConfigMapDefinition {
  name: string;
  namespace: string;
  data: Record<string, any>;
}

export default function createConfigMap({ name, namespace, data }: ConfigMapDefinition): V1ConfigMap {
  return {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name,
      namespace,
    },
    data: valuesToString(data)
  };
}
