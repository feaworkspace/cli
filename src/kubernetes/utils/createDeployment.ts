import {V1ConfigMap, V1Deployment, V1EnvFromSource, V1PersistentVolumeClaim, V1Secret, V1Volume, V1VolumeMount} from "@kubernetes/client-node";

export interface ContainerDefinition {
  name: string;
  image: string;
  configMap?: V1ConfigMap;
  configMapFiles?: V1ConfigMap;
  secret?: V1Secret;
  ports?: PortDefinition[];
  volumeMounts?: Array<VolumeMountsDefinition>;
  command?: string[];
  args?: string[];
}

export interface VolumeMountsDefinition {
  name: string;
  mountPath: string;
}

export interface PortDefinition {
  name: string;
  number: number;
  protocol: string;
  exposed: boolean;
}

export interface DeploymentDefinition {
  name: string;
  namespace: string;
  replicas: number;
  nodeSelector?: Record<string, string>;
  volume: V1PersistentVolumeClaim;
  containers: Array<ContainerDefinition>;
}

export default function createDeployment(definition: DeploymentDefinition): V1Deployment {
  return {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name: definition.name,
      namespace: definition.namespace
    },
    spec: {
      replicas: definition.replicas,
      revisionHistoryLimit: 1,
      selector: {
        matchLabels: {
          app: definition.name
        }
      },
      strategy: {
        type: "RollingUpdate",
        rollingUpdate: {
          maxUnavailable: 1,
          maxSurge: 0
        }
      },
      template: {
        metadata: {
          labels: {
            app: definition.name
          },
          annotations: {
            'kubectl.kubernetes.io/restartedAt': new Date().toISOString(),
          }
        },
        spec: {
          ...definition.nodeSelector && {
            nodeSelector: definition.nodeSelector
          },
          containers: definition.containers.map(container => ({
              name: container.name,
              image: container.image,
              command: container.command,
              args: container.args,
              ports: container.ports && container.ports.map(port => ({
                containerPort: port.number,
                name: port.name,
                protocol: port.protocol
              })),
              envFrom: envFrom(container.configMap, container.secret),
              volumeMounts: volumeMounts(definition.volume, container),
          })),
          volumes: volumes(definition.volume, definition.containers.map(c => c.configMapFiles).filter(Boolean) as V1ConfigMap[])
        }
      }
    }
  };
}

function envFrom(configMap?: V1ConfigMap, secret?: V1Secret): V1EnvFromSource[] {
  const env = [];
  if(configMap) {
    env.push({configMapRef: {name: configMap.metadata?.name!}});
  }
  if(secret) {
    env.push({secretRef: {name: secret.metadata?.name!}});
  }
  return env;
}

function volumes(pvc?: V1PersistentVolumeClaim, configs: V1ConfigMap[] = []): V1Volume[] {
  const volumes: V1Volume[] = [];

  if(pvc) {
    volumes.push({
      name: pvc.metadata?.name!,
      persistentVolumeClaim: {
        claimName: pvc.metadata?.name!
      }
    });
  }

  for(const config of configs) {
    volumes.push({
      name: config.metadata?.name!,
      configMap: {
        name: config.metadata?.name!
      }
    });
  }

  return volumes;

  // volumes: definition.containers.map(container => container.configMapFiles).filter(Boolean).map(config => ({
  //   name: config?.metadata?.name!,
  //   configMap: {
  //     name: config?.metadata?.name!
  //   }
  // })).concat(definition.volume ? [{
  //     name: definition.volume.metadata?.name!,
  //     persistentVolumeClaim: {
  //       claimName: definition.volume.metadata?.name!
  //     }
  //   }] : [])
}

function volumeMounts(pvc: V1PersistentVolumeClaim, container: ContainerDefinition): V1VolumeMount[] {
  const volumeMounts: V1VolumeMount[] = [];

  for(const volumeMount of container.volumeMounts ?? []) {
    volumeMounts.push({
      name: pvc.metadata?.name!,
      subPath: volumeMount.name,
      mountPath: volumeMount.mountPath
    });
  }

  if(container.configMapFiles) {
    const files = JSON.parse(container.configMapFiles?.metadata?.annotations!["files"]!);
    for(const [name, path] of Object.entries(files)) {
      volumeMounts.push({
        name: container.configMapFiles.metadata?.name!,
        mountPath: path as string,
        subPath: name
      });
    }
  }

  return volumeMounts;
}