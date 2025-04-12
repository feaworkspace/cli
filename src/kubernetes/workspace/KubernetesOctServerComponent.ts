import KubernetesComponent from "./KubernetesComponent";
import { WorkspaceConfig } from "../../config/types/WorkspaceConfig";
import Settings from "../../Settings.json";
import { generateToken } from "../../utils/CryptoUtils";

export default class KubernetesOctServerComponent extends KubernetesComponent {
    public static readonly NAME = "oct-server"; // move to config
    public static readonly PORT = 28545;
    public static readonly OCT_JWT_PRIVATE_KEY = generateToken();

    public constructor(mainConfig: WorkspaceConfig) {
        super(mainConfig, {
            image: Settings["oct-server"].image,
            tag: Settings["oct-server"].tag,
            name: KubernetesOctServerComponent.NAME,
            args: ["npm", "run", "start", "--workspace=open-collaboration-server", "--", "--port="+KubernetesOctServerComponent.PORT],
            secrets: {
                "OCT_JWT_PRIVATE_KEY": KubernetesOctServerComponent.OCT_JWT_PRIVATE_KEY,
            },
            env: {},
            volumes: [],
            ports: [
                {
                    name: KubernetesOctServerComponent.NAME,
                    protocol: "TCP",
                    number: KubernetesOctServerComponent.PORT,
                    ingress: {
                        subdomain: KubernetesOctServerComponent.NAME,
                        path: "/",
                        auth: false
                    }
                }
            ]
        });
    }
}
