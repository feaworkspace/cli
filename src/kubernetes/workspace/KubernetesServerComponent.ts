import K8sObject from "../types/K8sObject";
import KubernetesComponent from "./KubernetesComponent";
import { V1Deployment, V1Service } from "@kubernetes/client-node";
import { createIngress, createService } from "../utils";
import { WorkspaceComponentConfig, WorkspaceConfig, WorkspaceServerConfig } from "../../config/types/WorkspaceConfig";
import { merge } from "../../utils/ObjectUtils";
import { PortDefinition } from "../utils/createDeployment";

export default class KubernetesServerComponent extends KubernetesComponent {
    public static readonly PORT = 28543;

    public constructor(mainConfig: WorkspaceConfig, private serverConfig: WorkspaceServerConfig, private componentsConfig: Array<WorkspaceComponentConfig>) {
        super(mainConfig, serverConfig as any);
        
        this.config = merge(serverConfig, {
            namespace: mainConfig.namespace,
            secrets: {
                "FIREBASE_SERVICE_ACCOUNT_KEY": serverConfig.firebaseServiceAccountKey
            },
            env: {
                "ROUTES": JSON.stringify(componentsConfig.flatMap(it => it.ports).filter(port => port.ingress !== undefined).map(port => ({
                    host: this.getHost(port.ingress?.subdomain),
                    path: port.ingress?.path || "/",
                    auth: port.ingress?.auth || true,
                    targetPort: port.number
                }))),
                "ALLOWED_USERS": JSON.stringify(serverConfig.users),
                "HOSTNAME": this.getHost(this.serverConfig.name),
                "TOKEN_NAME": this.name("token"),
                "WORKSPACE_NAME": mainConfig.name
            },
            ports: [
                {
                    name: "gateway",
                    protocol: "TCP",
                    number: KubernetesServerComponent.PORT,
                    ingress: {
                        subdomain: this.serverConfig.name,
                        path: "/",
                        auth: true
                    }
                }
            ],
            volumes: []
        });
    }

    private getHost(subdomain?: string) {
        let domain = this.serverConfig.domain.replace("%s", subdomain || "");
        if (!subdomain) {
            domain = domain.substring(1); // remove separator
        }
        return domain;
    }
}
