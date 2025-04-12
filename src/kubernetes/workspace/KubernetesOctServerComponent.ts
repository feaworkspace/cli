import KubernetesComponent from "./KubernetesComponent";
import { WorkspaceConfig } from "../../config/types/WorkspaceConfig";
import Settings from "../../Settings.json";

export default class KubernetesOctServerComponent extends KubernetesComponent {
    public constructor(mainConfig: WorkspaceConfig) {
        super(mainConfig, {
            image: Settings.octServer.image,
            tag: Settings.octServer.tag,
            name: "oct-server",
            args: ["npm", "run", "start", "--workspace=open-collaboration-server", "--", "--port=28545"],
            env: {},
            secrets: {},
            volumes: [],
            ports: [
                {
                    name: "oct-server",
                    protocol: "TCP",
                    number: 28545,
                    ingress: {
                        subdomain: "oct",
                        path: "/",
                        auth: false
                    }
                }
            ]
        });
    }
}
