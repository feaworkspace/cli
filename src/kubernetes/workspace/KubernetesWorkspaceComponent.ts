import KubernetesComponent from "./KubernetesComponent";
import { WorkspaceConfig, WorkspaceWorkspaceConfig } from "../../config/types/WorkspaceConfig";
import { merge } from "../../utils/ObjectUtils";

export default class KubernetesWorkspaceComponent extends KubernetesComponent {
    public static readonly NAME = "theia";

    public constructor(mainConfig: WorkspaceConfig, config: WorkspaceWorkspaceConfig) {
        super(mainConfig, config as any);
        
        this.config = merge(config, {
            namespace: mainConfig.namespace,
            args: ["/workspace", "--hostname=0.0.0.0", "--port=28544"],
            env: {
                "COLLABORATION_SERVER_URL": "https://" + this.getHost("oct-server"),
                "WORKSPACE_SERVER_URL": "https://" + this.getHost(this.mainConfig.gateway.name)
            },
            volumes: [
                {
                    name: "workspace",
                    mountPath: "/workspace"
                }
            ],
            ports: [
                {
                    name: KubernetesWorkspaceComponent.NAME,
                    protocol: "TCP",
                    number: 28544,
                    ingress: {
                        subdomain: KubernetesWorkspaceComponent.NAME,
                        path: "/",
                        auth: true
                    }
                }
            ]
        });
    }
}
