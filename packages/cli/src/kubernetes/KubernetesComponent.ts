import { Component, MergedYamlConfig } from "../config/WorkspaceConfigTypes.js";
import K8sConfigMap from "./objects/K8sConfigMap.js";
import K8sDeployment from "./objects/K8sDeployment.js";
import K8sPersistentVolumeClaim from "./objects/K8sPersistentVolumeClaim.js";
import K8sResource from "./objects/K8sResource.js";
import K8sService from "./objects/K8sService.js";

export interface KubernetesComponentConfig extends Component {
    namespace: string;
    nodeSelector?: { [key: string]: string };
}

export default class KubernetesComponent {
    public constructor(private readonly config: KubernetesComponentConfig) {
    }

    public getResources(): K8sResource[] {
        const formattedName = this.format(this.config.name);

        const configMap = this.config.env ? new K8sConfigMap({
            name: `${formattedName}-config`,
            namespace: this.config.namespace,
            data: this.config.env
        }) : undefined;

        const persistentVolumeClaims = (Object.entries(this.config.volumes || {})).map(([name, volume]) => new K8sPersistentVolumeClaim({
            name: `${formattedName}-${this.format(name)}`,
            namespace: this.config.namespace,
            accessModes: ["ReadWriteOnce"],
            storageClassName: "openebs-hostpath",
            size: volume.size,
            mountPath: volume.mountPath
        }));

        const deployment = new K8sDeployment({
            name: formattedName,
            namespace: this.config.namespace,
            image: this.config.image,
            ports: Object.entries(this.config.ports).map(([name, port]) => ({ name, ...port })) as any,
            nodeSelector: this.config.nodeSelector,
            configMap,
            persistentVolumeClaims
        });

        const service = new K8sService({
            name: formattedName,
            namespace: this.config.namespace,
            deployment
        });

        return [configMap, ...persistentVolumeClaims, deployment, service].filter(resource => resource !== undefined);
    }

    /**
     * Returns the formatted name of the component.
     * Converts camelCase to kebab-case.
     */
    public format(name: string): string {
        return name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, "");
    }
}