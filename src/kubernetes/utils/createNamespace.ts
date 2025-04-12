import {V1Namespace} from "@kubernetes/client-node";

export default function createNamespace(namespace: string): V1Namespace {
  return {
    apiVersion: "v1",
    kind: "Namespace",
    metadata: {
      name: namespace
    }
  };
};