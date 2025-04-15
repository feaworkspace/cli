import KubernetesComponent from "./KubernetesComponent";
import { WorkspaceComponentConfig, WorkspaceConfig, WorkspaceGatewayConfig } from "../../config/types/WorkspaceConfig";
import { merge } from "../../utils/ObjectUtils";
import KubernetesOctServerComponent from "./KubernetesOctServerComponent";
import KubernetesWorkspaceComponent from "./KubernetesWorkspaceComponent";

export default class KubernetesGatewayComponent extends KubernetesComponent {
    public static readonly NAME = "gateway";
    public static readonly PORT = 28543;

    public constructor(mainConfig: WorkspaceConfig, private gatewayConfig: WorkspaceGatewayConfig, componentsConfig: Array<WorkspaceComponentConfig>) {
        super(mainConfig, gatewayConfig as any);
        
        this.config = merge(gatewayConfig, {
            namespace: mainConfig.namespace,
            secrets: {
                "FIREBASE_SERVICE_ACCOUNT_KEY": gatewayConfig.firebaseServiceAccountKey,
                "OCT_JWT_PRIVATE_KEY": KubernetesOctServerComponent.OCT_JWT_PRIVATE_KEY,
            },
            env: {
                "ROUTES": JSON.stringify(componentsConfig.flatMap(it => it.ports).filter(port => port.ingress !== undefined).map(port => ({
                    host: this.getHost(port.ingress?.subdomain),
                    path: port.ingress?.path || "/",
                    auth: port.ingress?.auth || true,
                    targetPort: port.number
                }))),
                "HOSTNAME": this.getHost(this.gatewayConfig.name),
                "THEIA_HOSTNAME": this.getHost(KubernetesWorkspaceComponent.NAME),
                "OCT_SERVER_URL": "http://127.0.0.1:" + KubernetesOctServerComponent.PORT,
                "TOKEN_NAME": this.name("token"),
                "WORKSPACE_NAME": mainConfig.name
            },
            ports: [
                {
                    name: "gateway",
                    protocol: "TCP",
                    number: KubernetesGatewayComponent.PORT,
                    ingress: {
                        subdomain: this.gatewayConfig.name,
                        path: "/",
                        auth: true
                    }
                }
            ],
            volumes: [
                {
                    name: "workspace",
                    mountPath: "/workspace"
                }
            ]
        });
    }
}
