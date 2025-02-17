import K8sDeployment from "./K8sDeployment.js";
import K8sResource from "./K8sResource.js";

export default class K8sService extends K8sResource {
    public constructor({ name, namespace, deployment }: {name: string, namespace: string, deployment: K8sDeployment}) {
        const ports = deployment.ports;
        super({
            apiVersion: "v1",
            kind: "Service",
            metadata: { name, namespace },
            spec: {
                selector: {
                    app: deployment.name
                },
                ports: ports.map(({ name, number, protocol }) => ({
                    port: number,
                    targetPort: number,
                    protocol: protocol || "TCP",
                    name,
                }))
            }
        });
    }
}