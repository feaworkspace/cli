import KubernetesComponent from "./KubernetesComponent";
import { WorkspaceComponentConfig, WorkspaceConfig, WorkspaceServerConfig } from "../../config/types/WorkspaceConfig";
import { merge } from "../../utils/ObjectUtils";
import KubernetesOctServerComponent from "./KubernetesOctServerComponent";

export default class KubernetesServerComponent extends KubernetesComponent {
    public static readonly PORT = 28543;

    public constructor(mainConfig: WorkspaceConfig, private serverConfig: WorkspaceServerConfig, componentsConfig: Array<WorkspaceComponentConfig>) {
        super(mainConfig, serverConfig as any);
        
        this.config = merge(serverConfig, {
            namespace: mainConfig.namespace,
            secrets: {
                "FIREBASE_SERVICE_ACCOUNT_KEY": serverConfig.firebaseServiceAccountKey,
                "OCT_JWT_PRIVATE_KEY": KubernetesOctServerComponent.OCT_JWT_PRIVATE_KEY,
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
                "OCT_SERVER_URL": "https://" + this.getHost(KubernetesOctServerComponent.NAME),
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
}
