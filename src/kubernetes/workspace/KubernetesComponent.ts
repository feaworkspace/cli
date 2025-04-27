import * as K8SUtils from "../utils";
import K8sObject from "../types/K8sObject";
import { ContainerDefinition } from "../utils/createDeployment";
import { WorkspaceComponentConfig, WorkspaceConfig } from "../../config/types/WorkspaceConfig";
import { formatName } from "../utils/encoding";
import { isNotEmpty } from "../../utils/ObjectUtils";

export default class KubernetesComponent {
    public constructor(protected readonly mainConfig: WorkspaceConfig, public config: WorkspaceComponentConfig) {
    }

    public name(...suffixes: string[]) {
        return formatName([this.mainConfig.name, "workspace", this.config.name, ...suffixes].join("-"));
    }

    public get ports() {
        return this.config.ports;
    }

    public get env() {
        return this.config.env;
    }

    public get configMap() {
        return isNotEmpty(this.config.env) ? K8SUtils.createConfigMap({
            name: this.name("config"),
            namespace: this.mainConfig.namespace,
            data: this.config.env
        }) : undefined;
    }

    public get secret() {
        return isNotEmpty(this.config.secrets) ? K8SUtils.createSecret({
            name: this.name("secret"),
            namespace: this.mainConfig.namespace,
            stringData: this.config.secrets
        }) : undefined;
    }

    public get configMapFiles() {
        return isNotEmpty(this.config.files) ? K8SUtils.createConfigMap({
            name: this.name("config-files"),
            namespace: this.mainConfig.namespace,
            annotations: {
                files: JSON.stringify(Object.entries(this.config.files).reduce((acc, item) => ({...acc, [item[0]]: item[1].mountPath}), {})),
            },
            data: Object.entries(this.config.files).reduce((acc, item) => ({...acc, [item[0]]: item[1].content}), {})
        }) : undefined;
    }

    public get containerDefinition(): ContainerDefinition {
        return {
            name: this.name(),
            image: this.config.image + ":" + this.config.tag,
            command: this.config.command,
            args: this.config.args,
            configMap: this.configMap,
            configMapFiles: this.configMapFiles,
            secret: this.secret,
            ports: this.config.ports.map(port => ({
                name: port.name,
                protocol: port.protocol,
                number: port.number,
                exposed: Boolean(port.ingress)
            })),
            volumeMounts: this.config.volumes && this.config.volumes.map(volume => ({
                name: volume.name,
                mountPath: volume.mountPath,
            })) || []
        }
    };

    public getResources(definedResources: Array<K8sObject>): Array<K8sObject> {
        return [this.configMap, this.configMapFiles, this.secret].filter(Boolean) as Array<K8sObject>;
    }

    public getHost(subdomain?: string) {
        let domain = this.mainConfig.domain.replace("%s", subdomain || "");
        if (!subdomain) {
            domain = domain.substring(1); // remove separator
        }
        return domain;
    }
}