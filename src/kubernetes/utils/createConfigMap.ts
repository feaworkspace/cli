import {V1ConfigMap} from "@kubernetes/client-node";
import { valuesToString } from "./encoding";

interface ConfigMapDefinition {
  name: string;
  namespace: string;
  data: Record<string, any>;
  annotations?: Record<string, string>;
}

export default function createConfigMap({ name, namespace, data, annotations }: ConfigMapDefinition): V1ConfigMap {
  return {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name,
      namespace,
      annotations
    },
    data: valuesToString(data)
  };
}
