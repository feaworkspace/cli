import KubernetesComponent from "./KubernetesComponent";
import { WorkspaceConfig, WorkspaceWorkspaceConfig } from "../../config/types/WorkspaceConfig";
import { merge } from "../../utils/ObjectUtils";

export default class KubernetesWorkspaceComponent extends KubernetesComponent {
    public constructor(mainConfig: WorkspaceConfig, config: WorkspaceWorkspaceConfig) {
        super(mainConfig, merge(config, {
            namespace: mainConfig.namespace,
            args: ["/workspace", "--hostname=0.0.0.0", "--port=28544"],
            env: {},
            volumes: [],
            ports: [
                {
                    name: "theia",
                    protocol: "TCP",
                    number: 28544,
                    ingress: {
                        subdomain: "theia",
                        path: "/",
                        auth: true
                    }
                }
            ]
        }));
    }
}
