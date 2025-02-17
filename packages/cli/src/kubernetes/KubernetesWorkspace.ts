import { MergedYamlConfig } from "../config/WorkspaceConfigTypes.js";
import * as k8s from '@kubernetes/client-node';
import K8sNamespace from "./objects/K8sNamespace.js";
import K8sResource from "./objects/K8sResource.js";
import KubernetesComponent from "./KubernetesComponent.js";

export default class KubernetesWorkspace {
    // private k8sApi: k8s.CoreV1Api;

    public constructor(private readonly config: MergedYamlConfig) {
        // const kc = new k8s.KubeConfig();
        // kc.loadFromDefault();
        
        // this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    }

    public getResources(): Array<K8sResource> {
        const resources: Array<K8sResource> = [];
        resources.push(new K8sNamespace({ name: this.config.namespace }));
        resources.push(...this.config.components.flatMap(component => new KubernetesComponent({
            ...component,
            namespace: this.config.namespace,
            nodeSelector: this.config.nodeSelector
        }).getResources()));
        return resources;
    }
}