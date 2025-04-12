import {V1PersistentVolumeClaim} from "@kubernetes/client-node";

interface PersistentVolumeClaimDefinition {
  name: string;
  namespace: string;
  storageClassName: string;
  accessModes: string[];
  size: string;
}

export default function createPersistentVolumeClaim(definition: PersistentVolumeClaimDefinition): V1PersistentVolumeClaim {
  return {
    apiVersion: 'v1',
    kind: 'PersistentVolumeClaim',
    metadata: {
      name: definition.name,
      namespace: definition.namespace,
    },
    spec: {
      storageClassName: definition.storageClassName,
      accessModes: definition.accessModes,
      resources: {
        requests: {
          storage: definition.size,
        },
      },
      ...definition.storageClassName === "manual" && {
        hostPath: {
          path: "/mnt" + definition.name
        },
      }
      // volumeMode: 'Filesystem',
    },
  };
}