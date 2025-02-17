import { NamedPort, Port } from "../../config/WorkspaceConfigTypes.js";
import K8sConfigMap from "./K8sConfigMap.js";
import K8sPersistentVolumeClaim from "./K8sPersistentVolumeClaim.js";
import K8sResource from "./K8sResource.js";

export default class K8sDeployment extends K8sResource {
    public readonly ports: NamedPort[];

    public constructor(
        {name, namespace, image, ports, nodeSelector, configMap, persistentVolumeClaims}:
        {name: string, namespace: string, image: string, ports: NamedPort[], nodeSelector?: Record<string, string>, configMap?: K8sConfigMap, persistentVolumeClaims?: K8sPersistentVolumeClaim[]}
    ) {
        super({
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: { name, namespace },
            spec: {
                selector: {
                    matchLabels: {
                        app: name
                    }
                },
                replicas: 1,
                template: {
                    metadata: {
                        labels: {
                            app: name
                        }
                    },
                    spec: {
                        ...(nodeSelector ? {nodeSelector} : {}),
                        containers: [{
                            name,
                            image,
                            ports: ports.map(port => ({
                                containerPort: port.number,
                                name: port.name
                            })),
                            ...(configMap ? {envFrom: [{configMapRef: {name: configMap.name}}] } : {}),
                            ...(persistentVolumeClaims?.length ? {volumeMounts: persistentVolumeClaims.map(pvc => ({
                                name: pvc.name,
                                mountPath: pvc.mountPath
                            }))} : {})
                        }],
                        ...(persistentVolumeClaims?.length ? {volumes: persistentVolumeClaims.map(pvc => ({
                            name: pvc.name,
                            persistentVolumeClaim: {
                                claimName: pvc.name
                            }
                        }))} : {})
                    }
                }
            }
        });

        this.ports = ports;
    }
}