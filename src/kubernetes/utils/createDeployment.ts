import {V1ConfigMap, V1Deployment, V1EnvFromSource, V1PersistentVolumeClaim, V1Secret} from "@kubernetes/client-node";

export interface ContainerDefinition {
  name: string;
  image: string;
  configMap?: V1ConfigMap;
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
              volumeMounts: container.volumeMounts && container.volumeMounts.map(volume => ({
                name: definition.volume.metadata?.name!,
                subPath: volume.name,
                mountPath: volume.mountPath
              }))
          })),
          volumes: definition.volume && [{
            name: definition.volume.metadata?.name!,
            persistentVolumeClaim: {
              claimName: definition.volume.metadata?.name!
            }
          }],
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